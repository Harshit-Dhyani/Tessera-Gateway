# Architecture

This document describes the current V1 architecture for Tessera Gateway.

Last updated: June 1, 2026

## System Overview

Tessera Gateway is a local, Windows-first gateway that routes MCP/local API requests into visible provider web interfaces.

Current verified shape:

- `packages/runtime` is the canonical orchestration layer.
- `apps/mcp` and `apps/gateway` are transport surfaces over runtime.
- `apps/desktop/src/main` owns Electron BrowserView lifecycle, window attachment, layout, and the loopback runtime bridge.
- `packages/provider-*` own provider-specific DOM assumptions, prompt insertion, submit behavior, readiness checks, and response capture.
- Provider login is manual and visible.

```text
User / MCP Client / Local API Client
  -> apps/mcp or apps/gateway
  -> packages/runtime
  -> desktop runtime bridge on 127.0.0.1:7870
  -> apps/desktop ProviderViewManager
  -> provider BrowserView
  -> provider web UI
```

## Current Execution Flow

### MCP `send_prompt`

1. MCP client calls `send_prompt`.
2. `apps/mcp` validates the provider id and prompt.
3. `packages/runtime` checks the desktop bridge and provider state.
4. Runtime posts to `/runtime/providers/sendPrompt` on `127.0.0.1:7870`.
5. Desktop `ProviderViewManager` selects the BrowserView by `providerId`.
6. Desktop dispatches the provider-owned browser automation script.
7. The provider script sets composer input, submits, and captures stable response text.
8. Desktop returns a normalized response.
9. Runtime returns the same normalized response to MCP.

Execution targets the requested `providerId`, not the currently focused pane. Multiple providers can be open at once in split or grid layout.

## Current Provider State

| Provider | Execution Package | Current Live Status |
|----------|-------------------|---------------------|
| ChatGPT | `packages/provider-chatgpt` | Implemented path, login/session dependent |
| Claude | `packages/provider-claude` | Login page detected, returns `PROVIDER_NOT_AUTHENTICATED` |
| Gemini | `packages/provider-gemini` | Working through MCP in current session |
| Perplexity | `packages/provider-perplexity` | Signup/login layer detected, returns `PROVIDER_NOT_AUTHENTICATED` |

Direct provider adapter classes still return scaffold responses. Real browser execution is currently owned by desktop runtime plus provider-owned `browserAutomation.ts` modules.

## Component Responsibilities

### `apps/desktop`

Owns:

- Electron app lifecycle
- BrowserWindow and BrowserView management
- Provider pane layout: single, split, grid
- Runtime bridge on loopback port `7870`
- Provider session partition lifecycle
- Dispatching provider-owned scripts to the selected BrowserView

Must not own:

- provider DOM selectors
- provider response capture rules
- router policy
- normalized response schema definitions
- credential parsing or login automation

### `apps/mcp`

Owns:

- MCP stdio server
- tool registration
- input validation
- tool response formatting

Must call shared runtime. It must not implement its own provider flow.

### `apps/gateway`

Owns:

- local HTTP compatibility surface
- health/model/chat endpoints
- request validation
- structured logging

Must call shared runtime. It must not duplicate provider automation.

### `packages/runtime`

Owns:

- provider id resolution
- desktop runtime availability checks
- normalized unavailable/error responses
- runtime HTTP client
- prompt timeout policy for desktop bridge calls
- MCP/API parity behavior

Runtime intentionally gives browser-automation providers page-level auth checks, because cookie count alone is not reliable for anonymous or partially authenticated provider pages.

### `packages/core`

Owns:

- provider registry
- shared schemas
- error codes
- normalized response contracts
- aliases and provider metadata

### `packages/provider-*`

Own:

- provider-specific selectors
- composer input synchronization
- submit behavior
- response capture rules
- page-level login/signup detection
- provider-specific smoke regression tests

Provider scripts must return honest failure codes when blocked by auth, disabled controls, changed UI, or timeout.

## Browser Automation Boundaries

Allowed:

- visible BrowserView automation in app-owned provider sessions
- native input setter synchronization for controlled composers
- provider-owned DOM queries
- stable text capture from answer-like containers
- honest failures when provider state is blocked

Forbidden:

- automatic login
- captcha solving
- stealth plugins or fingerprint spoofing
- importing external cookies
- reading normal Chrome/Edge profiles
- logging raw cookies, tokens, or credentials
- returning success from page chrome, prompt echo, or placeholder text

## Login and Session Architecture

Each provider uses an isolated persistent Electron session partition:

```text
persist:provider-chatgpt
persist:provider-claude
persist:provider-gemini
persist:provider-perplexity
```

Users log in manually when a provider requires it. Closing or focusing panes does not change the execution target; MCP still addresses the selected provider by id.

Session reset must be explicit and provider-scoped.

## Runtime Bridge

Desktop exposes local runtime endpoints on:

```text
http://127.0.0.1:7870
```

Important endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/health` | desktop bridge health |
| `/runtime/providers/state` | provider BrowserView states |
| `/runtime/providers/open` | open provider BrowserView |
| `/runtime/providers/sendPrompt` | run provider-owned prompt automation |
| `/runtime/providers/resetSession` | reset one provider session |
| `/runtime/providers/openParallel` | open multiple providers |

The bridge is loopback-only. CORS is restricted to known local UI origins.

## Data Flow

### Successful Gemini MCP Flow

```text
MCP send_prompt(gemini)
  -> runtime validates desktop bridge
  -> desktop selects gemini BrowserView
  -> provider-gemini browserAutomation sets controlled composer input
  -> Gemini returns answer text
  -> normalized response ok=true
```

### Perplexity Auth-Gated Flow

```text
MCP send_prompt(perplexity)
  -> runtime validates desktop bridge
  -> desktop selects perplexity BrowserView
  -> provider-perplexity detects signup/login layer
  -> normalized response ok=false, PROVIDER_NOT_AUTHENTICATED
```

## Verification

Static verification:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Live MCP smoke verification:

```bash
bun run dev:desktop
bun run mcp:gemini "Say hi in one short sentence."
bun run mcp:perplexity "Say hi in one short sentence."
bun run mcp:claude "Say hi in one short sentence."
```

The desktop runtime must remain running for live provider smoke tests. On Windows, a visible desktop launch is more reliable than launching Electron hidden because the app can exit when its window lifecycle closes.

## Security Boundaries

1. Renderer to main: context-isolated preload bridge only.
2. MCP/gateway to runtime: validated provider ids and prompts.
3. Runtime to desktop bridge: loopback-only HTTP.
4. Desktop to provider web UI: isolated BrowserView session per provider.
5. Provider scripts to DOM: provider-owned selectors only.
6. Logs: no raw cookies, tokens, credentials, or replayable session identifiers.

## Extension Points

| Area | Owner | Notes |
|------|-------|-------|
| Add provider | `packages/provider-*` plus `packages/core/src/providers/registry.ts` | Add provider-owned automation and tests. |
| Add MCP tool | `apps/mcp` | Must call shared runtime. |
| Add HTTP route | `apps/gateway` | Must call shared runtime. |
| Add storage | `packages/storage` | SQLite/Drizzle ownership. |
| Add runtime behavior | `packages/runtime` | Keep transport-independent. |
