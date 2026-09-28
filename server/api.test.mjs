import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer, createApiHandler } from './index.mjs';
async function withServer(options, run) {
  const server = createApiServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const body = { system: 'Test coach', messages: [{ role: 'user', content: 'Hello' }] };
const post = (url, data = body, headers = {}) => fetch(url + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
test('provider credentials stay on the server and model parameters are bounded', async () => {
  let sent;
  await withServer({ env: { ANTHROPIC_API_KEY: 'test-only-key' }, fetchImpl: async (url, options) => {
    sent = options; return Response.json({ content: [{ type: 'text', text: 'Hello' }], internal: 'discard' });
  } }, async url => {
    const response = await post(url, { ...body, max_tokens: 999999 });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { content: [{ type: 'text', text: 'Hello' }] });
    assert.equal(sent.headers['x-api-key'], 'test-only-key');
    assert.equal(JSON.parse(sent.body).max_tokens, 1500);
  });
});
test('missing credentials produce an honest unavailable state', async () => {
  await withServer({ env: {} }, async url => assert.equal((await post(url)).status, 503));
});
test('invalid input and cross-site calls never reach the provider', async () => {
  await withServer({ env: {}, fetchImpl: () => { throw new Error('Must not call'); } }, async url => {
    assert.equal((await post(url, { system: '', messages: [] })).status, 400);
    assert.equal((await post(url, body, { Origin: 'https://untrusted.example' })).status, 403);
    assert.equal((await post(url, body, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
    assert.equal((await post(url, { ...body, system: 'x'.repeat(33000) })).status, 413);
  });
});
test('upstream errors never echo provider secrets', async () => {
  await withServer({ env: { ANTHROPIC_API_KEY: 'test-only-key' }, fetchImpl: async () => new Response('provider secret', { status: 401 }) }, async url => {
    const response = await post(url); assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes('provider secret'));
  });
});
test('request bursts are rate limited', async () => {
  await withServer({ env: {}, now: () => 1000 }, async url => {
    for (let i = 0; i < 30; i++) await post(url);
    const response = await post(url); assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '60');
  });
});
test('location queries are encoded and use a server-side key', async () => {
  await withServer({ env: { GEOAPIFY_API_KEY: 'test-only-key' }, fetchImpl: async target => {
    assert.equal(target.searchParams.get('text'), 'Cape Town');
    assert.equal(target.searchParams.get('apiKey'), 'test-only-key');
    return Response.json({ features: [{ properties: { city: 'Cape Town' } }] });
  } }, async url => {
    const response = await fetch(url + '/api/location?text=Cape%20Town');
    assert.equal(response.status, 200); assert.equal((await response.json()).features.length, 1);
  });
});

test('serverless parsed request bodies use the same validation', async () => {
  let status; let data;
  const handler = createApiHandler({ env: {} });
  const response = { writeHead(code) { status = code; }, end(body) { data = JSON.parse(body); } };
  await handler({ url: '/api/chat', method: 'POST', headers: { 'content-type': 'application/json' }, body }, response);
  assert.equal(status, 503); assert.equal(data.error, 'Coaching is not configured.');
  await handler({ url: '/api/chat', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken' }, response);
  assert.equal(status, 400);
});
