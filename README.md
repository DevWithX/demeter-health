# Demeter Health

A React fitness-coaching prototype with guided onboarding, four coach personas,
local profile storage, and Three.js exercise demonstrations. AI and location
requests go through a small Node API; provider credentials never enter the browser bundle.

## Run locally

Requires Node 22.13 or newer.

```sh
npm ci
cp .env.example .env
# Set your own provider keys in .env, then start the API:
npm run server
```

In a second terminal, run `npm start` and open http://localhost:3000.
The development server forwards `/api` to the loopback API on port 3001.
Without provider keys, onboarding and exercise demonstrations remain available;
AI requests show an unavailable state. Location can be entered manually.

```sh
npm run test:server
CI=true npm test -- --watchAll=false
npm run build
```

## Architecture and boundaries

- React owns onboarding, coach selection, unit conversion, and the exercise viewer.
- The Node API validates payloads, limits request size and frequency, applies timeouts,
  and keeps Anthropic/Geoapify credentials server-side.
- Profiles stay in this browser's local storage. Clearing the saved profile removes
  that local record. AI requests send the entered profile and messages to Anthropic;
  location searches send the typed location to Geoapify.
- An upstream outage never substitutes a generic programme and calls it personalised.
- This is a wellness prototype, not a clinical service or a validated treatment tool.

## Deployment

The included API binds to loopback. To deploy, serve the built React files and proxy
`/api` through the same HTTPS origin to the API; set `ALLOWED_ORIGIN` accordingly.
Before offering paid-provider access publicly, add user authentication, per-user
quotas and a shared rate limiter. The current in-memory limiter is per process and
is intended for local development. Do not deploy only the static build and expect
AI features to work.

### Existing Vercel deployment

The `api/chat.mjs` and `api/location.mjs` entry points use the same validated handler
as the local server. Set the server-only provider keys and `ALLOWED_ORIGIN` in
Vercel environment settings. Preview deployments default to their `VERCEL_URL`
origin when no explicit origin is configured. These adapters do not add user
authentication or shared quotas; configure those before enabling paid-provider
access for an unrestricted audience.

## Credential hygiene

A geocoding key was previously committed. It must be revoked/rotated in Geoapify;
removing it from current source does not remove it from Git history. Keep replacement
keys only in `.env` or deployment secrets. Never put them in `REACT_APP_*` variables.

## Next improvements

- Authenticated deployment and durable usage quotas.
- Explicit opt-in for saving profiles on shared devices.
- Accessibility review and broader end-to-end onboarding coverage.
- Evaluation of generated responses before use outside a prototype.
