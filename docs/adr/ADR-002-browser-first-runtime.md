# ADR-002: Browser-First Local Runtime

## Decision

Tessera Gateway must be usable from a normal browser over loopback even when the desktop window is closed.

`apps/gateway` is the browser-accessible local surface. `apps/desktop` is optional and should own provider BrowserView/window lifecycle only.

## Context

The original scaffold made the desktop app the first process and treated the gateway/MCP paths as dependent on the desktop runtime bridge. The product requirement changed: the user must be able to keep using Tessera Gateway through a web browser after closing the desktop application.

## Alternatives Considered

- Keep Electron as the root runtime: rejected because closing the desktop window would stop normal browser/API/MCP use.
- Make the gateway a hosted backend: rejected because V1 is local-only and Windows-first.
- Split the local gateway from desktop provider windows: accepted because it preserves browser access while keeping visible provider sessions available when needed.

## Consequences

- The gateway must become the long-running local runtime entrypoint.
- Desktop-only operations must return explicit unavailable/not-ready responses when the desktop shell is closed.
- Browser UI, local API, and MCP parity tests need to cover desktop-unavailable behavior.
- Provider BrowserView automation still belongs to desktop/session/provider-owned modules.

## Review Date

2026-12-01
