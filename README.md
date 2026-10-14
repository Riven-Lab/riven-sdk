# Riven Analytics TypeScript SDK

The official TypeScript SDK for sending custom events to Riven Analytics.

> **Foundation release:** The ingestion path, request header, and event envelope in this starter are proposed server contract details. Align them with the Riven ingestion API before publishing a release.

## Installation

The package name is proposed as @riven-lab/sdk. Confirm the npm scope and package availability before the first publish.

~~~bash
npm install @riven-lab/sdk
~~~

## Quick start

~~~typescript
import { createClient } from "@riven-lab/sdk";

const analytics = createClient({
  endpoint: "https://analytics.example.com",
  projectKey: "public-project-key"
});

await analytics.track("signup_completed", {
  method: "email"
});
~~~

track() sends one event and resolves when the API returns a successful HTTP status. Invalid input and failed requests reject with RivenError, whose code is stable for programmatic handling.

## Configuration

- endpoint: required absolute HTTP(S) API URL.
- projectKey: required public, restricted ingestion key. Never use an administrative secret in a browser.
- timeoutMs: optional request timeout, 10 seconds by default.
- ingestionPath: optional absolute path, /v1/events by default. Confirm this with the server contract.
- fetch: optional custom fetch implementation.
- now: optional injectable clock returning a Date.

Event names must begin with a letter and contain up to 128 letters, numbers, periods, underscores, colons, or hyphens. Properties must be JSON-compatible values. Do not send passwords, tokens, payment details, or other sensitive information.

## Behavior and limitations

- One call to track() makes one HTTP POST; there is no local queue, batching, retry, or offline persistence.
- A non-2xx response rejects with RivenError code HTTP_ERROR and its HTTP status.
- A timeout rejects with REQUEST_TIMEOUT; other network failures use NETWORK_ERROR.
- The SDK does not automatically collect user identity, cookies, IP metadata, or browser state.
- Browser use requires a public project key restricted by the server to event ingestion.

## Project structure

~~~text
riven-sdk/
├── .github/
│   ├── ISSUE_TEMPLATE/bug_report.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/ci.yml
├── docs/architecture.md
├── examples/node.ts
├── src/
│   ├── client.ts
│   ├── errors.ts
│   ├── index.ts
│   ├── transport.ts
│   ├── types.ts
│   └── validation.ts
├── tests/unit/
│   ├── client.test.ts
│   └── transport.test.ts
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
~~~

## Development

Requires Node.js 20 or newer.

~~~bash
npm install
npm run typecheck
npm test
npm run build
~~~

The build emits ESM, CommonJS, source maps, and TypeScript declarations into dist/. Only dist/, this README, and the license are included in the npm package.

## Implementation plan

1. Stabilize the server contract: agree on URL, authentication header, schema, accepted statuses, payload limits, rate limits, and idempotency behavior with the ingestion API.
2. Ship the core client: keep the public surface small with client creation, track(), typed properties, and predictable errors.
3. Protect the contract: test validation and HTTP behavior, run typecheck and build in CI, and add contract tests against a compatible local or staging backend.
4. Publish deliberately: confirm the npm package name and license, review the packed files, document supported runtimes, and release with semantic versioning.
5. Grow from evidence: add batching, bounded retries, identity, browser helpers, or framework adapters only when the backend and users define their behavior.

See docs/architecture.md for module boundaries, the proposed wire format, privacy notes, and growth decisions. See CONTRIBUTING.md for the pull request process.

## License

MIT. See LICENSE.
