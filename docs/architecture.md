# Architecture

## Scope

This package is the TypeScript client for sending custom analytics events to the Riven ingestion API. It validates configuration and event data, creates the wire envelope, and sends one HTTP request per track() call. The API owns authentication, validation, persistence, and event IDs. Storage, aggregation, dashboards, user identity, and automatic page collection belong to other Riven services or future packages.

## Module boundaries

index.ts is the supported public API. The client validates configuration and events, then calls the transport. The transport owns HTTP details, parses the accepted event ID, and returns stable RivenError instances on failure. Types describe the boundary between these modules.

~~~text
consumer -> public exports -> client -> validation
                                |
                                +-> transport -> Riven ingestion API
~~~

Internal files are not package exports. Keep network behavior in transport and validate inputs before sending them. This lets implementation details evolve while keeping the public API deliberate.

## Current event contract

The SDK sends one JSON POST to /v1/events with the x-project-key header:

~~~json
{
  "name": "signup_completed",
  "properties": { "method": "email" },
  "timestamp": "2026-10-14T12:00:00.000Z"
}
~~~

The deployed API returns HTTP 202 with { "accepted": true, "eventId": "..." }. track() resolves with the event ID only when that response is valid. Keep API path, headers, and response parsing inside the transport module. Update this document when the backend contract changes.

## Reliability and privacy

- Requests have a configurable timeout. A timeout or network error rejects with a typed RivenError.
- The SDK does not currently retry, queue, batch, or persist events offline. The API has no idempotency contract, so retrying after a lost response could create duplicate events.
- Add automatic retries only after the API accepts idempotency keys and defines their retention and conflict behavior.
- Add batching only after the API defines batch limits, response shape, and partial-failure behavior.
- HTTP errors expose status, a validated API machine code when present, and Retry-After duration when present. Error messages do not include raw response bodies or event properties.
- The SDK collects no identity, IP metadata, cookies, or browser state by default.
- Project keys used in browsers must be public, scoped ingestion keys. Secret credentials must stay on a trusted server.
- Never send passwords, tokens, payment data, or other sensitive information as event properties.

## Growth path

Add capabilities when the server contract and real usage support them. Keep batching and retry policies in a queue/transport layer. Add framework adapters as separate entry points or packages when they need different dependencies or runtime behavior. Version the event schema explicitly when the wire contract changes. Preserve backward compatibility for public API changes and use semantic versioning.

Keep one package while the SDK has one runtime and a small public surface. Split packages only when a platform adapter needs different dependencies, lifecycle, or release cadence.

## Package layout

- src/client.ts: configuration, validation orchestration, and public client behavior.
- src/validation.ts: event and JSON property validation.
- src/transport.ts: HTTP request, timeout handling, and API response parsing.
- src/errors.ts: stable error codes and safe HTTP metadata.
- src/types.ts: public event, result, and configuration types.
- tests/unit/: fast tests of public behavior and transport failures.
- examples/: copyable consumer usage.
- docs/: contracts, decisions, and growth decisions.
