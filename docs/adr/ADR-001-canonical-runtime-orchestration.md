# ADR-001: Canonical Runtime Orchestration

## Status
- [x] Accepted

## Date
2026-04-23

## Context
The repo had duplicated orchestration logic across the desktop shell, gateway, and MCP surfaces, plus stale provider-specific assumptions outside provider-owned packages. That created drift in state reporting, error mapping, and execution flow.

## Decision
Make `packages/runtime` the canonical orchestration layer for provider validation, alias resolution, state aggregation, open/focus/layout commands, prompt execution, and normalized success/error responses.

Keep `apps/gateway` and `apps/mcp` as thin transport surfaces over runtime.
Keep `apps/desktop/src/main` limited to BrowserView lifecycle, workspace layout, and runtime bridge ownership.
Keep provider-specific DOM and execution assumptions inside provider packages only.

## Consequences
Provider behavior becomes easier to reason about and easier to test.

The system loses fake parity paths that previously let one surface pretend to own orchestration.

Scaffold-only provider adapters must fail honestly until real browser automation is added.

## Alternatives Considered
- Keep orchestration split between gateway, desktop, and MCP. Rejected because it keeps behavior inconsistent and hard to debug.
- Let provider-specific logic stay in desktop main. Rejected because it violates ownership boundaries and makes browser-shell code brittle.
- Preserve legacy router ownership. Rejected because runtime already owns the live orchestration path and the router package would become duplicate surface area.

## Review
2026-10-23
