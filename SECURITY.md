# Security Policy

Tessera Gateway is a local-only, Windows-first gateway that controls provider
web interfaces through human-owned browser sessions. Security reports are taken
seriously because the project touches local browser profiles, localhost
services, MCP tools, and provider session state.

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` / V1 active development | Yes |
| Older commits or forks | Best effort |

## Reporting a Vulnerability

Do not paste secrets, cookies, tokens, private prompts, full logs with session
data, or provider account details into a public issue.

If GitHub private vulnerability reporting is enabled for this repository, use
that channel. If it is not enabled, open a minimal public issue that describes
the affected area without sensitive details and state that private details are
available to the maintainer.

Useful report details:

- affected command, app, route, MCP tool, or provider
- expected behavior
- actual behavior
- relevant error code
- safe redacted logs
- Windows, Bun, Node, and Electron versions when relevant

## Security Boundaries

Tessera Gateway must stay local-first and explicit.

- Local HTTP services bind to loopback by default.
- Provider login must be human-initiated.
- Provider browser profiles must be app-owned and provider-isolated.
- Raw cookies, tokens, credentials, and replayable session identifiers must not be logged or exposed.
- MCP tools and HTTP routes must share validation and runtime behavior.
- File and URL tools must be allowlisted, bounded, and logged.

## Forbidden Changes

The following changes are not accepted:

- captcha solving
- credential scraping
- importing sessions from normal Chrome or Edge profiles
- stealth plugins, fingerprint spoofing, or anti-detection bypasses
- exposing raw browser DevTools endpoints
- broad CORS or non-loopback binding by accident
- arbitrary filesystem passthrough
- shell execution through unvalidated user input
- fake provider success when auth, UI, or capture failed

## Handling Security Fixes

Security fixes should:

1. Reproduce or clearly describe the failure mode.
2. Add a focused regression test when practical.
3. Fix the smallest correct layer.
4. Redact sensitive logs and outputs.
5. Update `AGENTS.md`, docs, tests, or CI if the fix reveals a missing permanent rule.
6. Run the relevant verification commands and report any limits honestly.

## No Warranty

Tessera Gateway is experimental local software. See the MIT license for warranty
terms. Users are responsible for the accounts and provider sessions they choose
to connect.
