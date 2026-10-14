# Contributing

Thanks for helping improve the Riven TypeScript SDK.

## Before opening a pull request

1. Open or update an issue for significant API or wire-contract changes.
2. Create a focused branch from main, such as feat/event-validation or fix/request-timeout.
3. Keep changes scoped and add or update tests and documentation for observable behavior.
4. Run npm install, npm run typecheck, npm test, and npm run build.
5. Open a pull request using the template and describe compatibility or backend contract changes.

## Review expectations

The public API and event wire format are compatibility boundaries. Changes to either should include an example, tests, and an explicit migration note when behavior changes. Do not include real project keys, user data, or production event payloads in the repository.

## Commit and release conventions

Use concise conventional commit subjects, for example feat: add configurable ingestion path or fix: classify request timeouts. Releases follow semantic versioning and are prepared by maintainers after CI and a clean package-content review.
