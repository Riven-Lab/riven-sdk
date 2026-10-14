# Riven Analytics TypeScript SDK

The official TypeScript SDK for sending custom events to Riven Analytics.

> **Foundation release:** The ingestion path, request header, and event envelope in this starter are a proposed server contract. Align them with the Riven ingestion API before publishing a release.

## Installation

The package name is proposed as `@riven-lab/sdk`. Confirm npm scope and package availability before the first publish.

```bash
npm install @riven-lab/sdk
```

## Quick start

```typescript
import { createClient } from `@riven-lab/sdk`;

const analytics = createClient({
  endpoint: `https://analytics.example.com`,
  projectKey: `public-project-key`
});

await analytics.track(`signup_completed`, {
  method: `email`
});
```

`track()` sends one event and resolves when the API returns a successful HTTP status. Invalid input and failed requests reject with `RivenError`, whose `code` is stable for programmatic handling.

## Configuration

The client requires an endpoint and a public project key. It accepts an optional timeout (10 seconds by default), ingestion path (`/v1/events`), fetch implementation, and clock. Confirm the endpoint path, authentication header, and event schema with the ingestion API before release.

## Development

Requires Node.js 20 or newer. Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build`.

See `docs/architecture.md` for module boundaries and the proposed wire contract. See `CONTRIBUTING.md` for the pull request process.

## License

MIT. See `LICENSE`.
