# Riven Analytics TypeScript SDK

The official TypeScript SDK sends custom events to the Riven Analytics API.

## Installation

~~~bash
npm install @riven-lab/sdk
~~~

Confirm the npm package is published under this scope before installing from a clean environment.

## Live ingestion contract

The current API is deployed at https://riven-server.onrender.com. It accepts POST /v1/events with the x-project-key header and a JSON event containing name, properties, and an ISO timestamp with an explicit timezone. Accepted requests return HTTP 202 with { accepted: true, eventId }. The API validates event names and JSON properties; invalid input returns 400, missing or invalid keys 401, oversized payloads 413, and rate limiting 429.

## Quick start

~~~typescript
import { createClient } from "@riven-lab/sdk";

const analytics = createClient({
  endpoint: "https://riven-server.onrender.com",
  projectKey: process.env.RIVEN_PROJECT_KEY!
});

const { eventId } = await analytics.track("signup_completed", {
  method: "email"
});

console.log("Accepted event:", eventId);
~~~

The project key is an ingestion credential, not a dashboard login or administrative secret. A browser app may use only a project key that is intended to be public and limited to event ingestion. Never place Supabase service-role credentials in the SDK or browser.

## Client options

- endpoint: required absolute HTTP(S) API URL.
- projectKey: required project ingestion key.
- timeoutMs: request timeout in milliseconds; defaults to 10 seconds.
- ingestionPath: path on the configured API origin; defaults to /v1/events.
- fetch: optional custom fetch implementation for runtimes/network customization.
- now: optional clock function for timestamps.

Event names start with a letter and contain up to 128 letters, numbers, periods, underscores, colons, or hyphens. Properties must be JSON-compatible objects. Do not send passwords, tokens, payment details, or other sensitive information.

## Results and errors

track() resolves with { eventId } only after receiving a valid successful API response. Invalid input rejects with RivenError code INVALID_EVENT or INVALID_CONFIGURATION. HTTP failures use HTTP_ERROR and include the status; API machine codes and Retry-After duration are exposed when the server provides them. Network failures use NETWORK_ERROR, timeouts use REQUEST_TIMEOUT, and malformed success payloads use INVALID_RESPONSE.

## Reliability limits

One track() call sends one event in one HTTP request. The SDK does not currently queue, batch, retry, or persist events offline. The server does not yet guarantee idempotency, so automatic retries could create duplicate events if the server stored an event but its response was lost. Add retries only after the server supports idempotency keys. Add batching only after the server defines batch limits and partial-failure behavior.

The SDK does not automatically collect identity, cookies, IP metadata, or browser state.

## Development

Requires Node.js 20 or newer.

~~~bash
npm install
npm run typecheck
npm test
npm run build
~~~

The build emits ESM, CommonJS, source maps, and TypeScript declarations into dist/. See [docs/architecture.md](docs/architecture.md) for module boundaries and growth decisions, and [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.

## License

MIT. See LICENSE.
