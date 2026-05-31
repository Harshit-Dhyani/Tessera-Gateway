# Changelog

All notable changes to Tessera Gateway will be documented in this file.

This project follows a practical changelog format during V1 development. Dates
use `YYYY-MM-DD`.

## Unreleased

- Continue hardening provider automation and runtime bridge behavior.
- Continue adding MCP and local API parity tests.
- Continue improving local security boundaries and release checks.

## 2026-06-01

### Added

- GitHub Actions CI for lint, typecheck, test, and build on Windows.
- GitHub issue templates for bugs, provider breakage, and documentation updates.
- Pull request template and Dependabot configuration.
- Git and GitHub workflow documentation.
- Provider login and smoke-test documentation.
- Provider-owned prompt submission and response capture paths for Gemini, Perplexity, Claude, and ChatGPT runtime flows.

### Changed

- Documented Tessera Gateway as a local desktop gateway, not a hosted chatbot or SaaS gateway.
- Clarified that desktop provider windows are login/session surfaces while runtime packages own execution contracts.
- Updated docs to describe current MCP behavior and login-gated provider states.

### Verified

- Gemini returned a real response through MCP in the current local session.
- Perplexity and Claude returned explicit authentication-required failures when provider login pages were shown.

### Known Limits

- Provider web interfaces can change without notice.
- Perplexity, Claude, and ChatGPT may require manual login before prompt execution.
- Browser automation remains experimental and must fail honestly when provider UI capture is not reliable.
