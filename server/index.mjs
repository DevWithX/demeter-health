import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function readJson(request) {
  if (request.body !== undefined) {
    const serialized = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    if (Buffer.byteLength(serialized) > 32000) throw new RequestError(413, 'Request is too large.');
    try { return JSON.parse(serialized); } catch { throw new RequestError(400, 'Invalid JSON.'); }
  }
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 32000) throw new RequestError(413, 'Request is too large.');
  }
  try { return JSON.parse(body); } catch { throw new RequestError(400, 'Invalid JSON.'); }
}
function validateChat(body) {
  if (!body || typeof body.system !== 'string' || body.system.length > 6000 ||
      !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 30 ||
      body.messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 10000)) {
    throw new RequestError(400, 'Provide a system prompt and up to 30 text messages.');
  }
}
export function createApiHandler({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  const counts = new Map();
  return async (request, response) => {
    const reply = (status, body) => {
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(JSON.stringify(body));
    };
    try {
      const url = new URL(request.url, 'http://localhost');
      if (!['/api/chat', '/api/location'].includes(url.pathname)) return reply(404, { error: 'Not found.' });
      const origin = request.headers.origin;
      if (origin && origin !== (env.ALLOWED_ORIGIN || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:3000'))) return reply(403, { error: 'Origin is not allowed.' });
      if (request.headers['sec-fetch-site'] === 'cross-site') return reply(403, { error: 'Cross-site requests are not allowed.' });
      const expectedMethod = url.pathname === '/api/chat' ? 'POST' : 'GET';
      if (request.method !== expectedMethod) return reply(405, { error: 'Method not allowed.' });
      const current = now();
      for (const [key, entry] of counts) if (entry.until <= current) counts.delete(key);
      const key = request.socket?.remoteAddress || 'shared';
      const entry = counts.get(key) || { count: 0, until: current + 60000 };
      counts.set(key, entry);
      if (++entry.count > 30) { response.setHeader('Retry-After', Math.ceil((entry.until - current) / 1000)); return reply(429, { error: 'Too many requests. Try again shortly.' }); }
      let upstream;
      if (url.pathname === '/api/chat') {
        if (!request.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'Use application/json.' });
        const body = await readJson(request); validateChat(body);
        if (!env.ANTHROPIC_API_KEY) return reply(503, { error: 'Coaching is not configured.' });
        upstream = await fetchImpl('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: AbortSignal.timeout(25000),
          headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 1500, system: body.system, messages: body.messages }),
        });
      } else {
        const text = url.searchParams.get('text')?.trim();
        if (!text || text.length < 2 || text.length > 120) return reply(400, { error: 'Enter a location between 2 and 120 characters.' });
        if (!env.GEOAPIFY_API_KEY) return reply(503, { error: 'Location suggestions are not configured.' });
        const target = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
        target.search = new URLSearchParams({ text, limit: '6', apiKey: env.GEOAPIFY_API_KEY }).toString();
        upstream = await fetchImpl(target, { signal: AbortSignal.timeout(8000) });
      }
      if (!upstream.ok) return reply(502, { error: 'The provider is temporarily unavailable.' });
      const data = await upstream.json();
      if (url.pathname === '/api/chat') {
        const content = data.content?.filter(item => item.type === 'text' && typeof item.text === 'string').map(({ text }) => ({ type: 'text', text }));
        if (!content?.length) return reply(502, { error: 'The provider returned no response.' });
        return reply(200, { content });
      }
      return reply(200, { features: data.features || [] });
    } catch (error) {
      return reply(error instanceof RequestError ? error.status : 502, { error: error instanceof RequestError ? error.message : 'The service is temporarily unavailable.' });
    }
  };
}
export function createApiServer(options) {
  return createServer(createApiHandler(options));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3001);
  createApiServer().listen(port, '127.0.0.1', () => console.log(`Demeter API listening on http://127.0.0.1:${port}`));
}
