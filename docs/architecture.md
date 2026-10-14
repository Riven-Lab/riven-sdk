# Architecture

## Scope

This package is the TypeScript client for sending analytics events. It validates inputs, creates the event envelope, and sends one HTTP request per track() call. Storage, aggregation, dashboards, user identity, and automatic page collection belong to other Riven services or future packages.

## Dependency direction

index.ts is the supported public API. The client validates configuration and events, then calls the transport. The transport owns HTTP details and returns a stable RivenError on failure. Types describe the boundary between modules.

~~~text
consumer -> public exports -> client -> validation
                                |
                                +-> transport -> Riven ingestion API
~~~

Internal files are not package exports. This lets implementation details evolve while keeping the public API deliberate.

## Initial event contract

The starter sends a JSON POST to /v1/events with the x-project-key header:

~~~json
{
  "name": "signup_completed",
  "properties": { "method": "email" },
  "timestamp": "2026-10-14T12:00:00.000Z"
}
~~~

This is a proposed contract because the backend API has not been supplied. Confirm the path, authentication header, envelope, response statuses, and size limits with the ingestion service before publishing 0.1.0. Keep these details in the transport module and cover changes with contract tests.

## Reliability and privacy

- track() resolves only after a successful HTTP response and rejects with a typed RivenError otherwise.
- Requests have a configurable timeout. This first version does not retry or buffer, so callers can observe failure without hidden duplicate submissions.
- The SDK collects no identity, IP metadata, cookies, or browser state by default.
- Project keys used in browsers must be public, scoped ingestion keys. Secret credentials must stay on a trusted server.
- Avoid logging property values. Never send passwords, tokens, payment data, or other sensitive information as event properties.

## Growth path

Add features only after the server contract and real usage require them. Keep batching and retry policies in a queue/transport layer; add framework adapters as separate entry points or packages; version the event schema explicitly when the wire contract changes. Preserve backward compatibility for public API changes and use semantic versioning.

## Package layout

- src/client.ts: configuration and public client behavior.
- src/validation.ts: event and JSON property validation.
- src/transport.ts: HTTP request and timeout handling.
- src/errors.ts: stable error codes consumers can inspect.
- src/types.ts: public event and configuration types.
- tests/unit/: fast tests of public behavior and transport failures.
- examples/: copyable consumer usage.
- docs/: contracts, decisions, and growth decisions.

Keep one package while the SDK has one runtime and a small public surface. Split packages only when a platform adapter needs different dependencies, lifecycle, or release cadence.
