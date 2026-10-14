# Security policy

## Reporting a vulnerability

Please do not report security vulnerabilities in public issues. Contact the Riven Labs maintainers through the private vulnerability reporting option on the GitHub repository. Include the affected version, impact, and steps to reproduce when safe to do so.

## Key handling

Never commit credentials or real event data. Browser applications must use public, restricted project keys; administrative secrets must remain on trusted servers. The SDK does not redact arbitrary event properties, so callers are responsible for excluding sensitive data.
