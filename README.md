# Tessera Gateway

Tessera Gateway is a Windows-first local AI gateway for controlling multiple provider web interfaces from one local runtime.

It is not a hosted chatbot and it does not use unofficial model APIs. V1 uses visible provider web sessions inside an Electron desktop shell, then exposes those sessions through:

- a local browser-accessible gateway surface
- a local HTTP API compatibility layer
- an MCP server
- one shared runtime bridge
- provider-owned browser automation scripts

## Current Status

Current phase: `browser_automation`

The provider adapter packages still expose scaffold adapter classes for the package interface, but the desktop runtime now has real provider-owned browser automation for prompt submission and response capture.

Verified on June 1, 2026:

| Provider | MCP `send_prompt` Status | Login Requirement Observed | Notes |
|----------|--------------------------|----------------------------|-------|
| Gemini | Working | No login required in current session | Returned real text through MCP. |
| Perplexity | Blocked by provider page | Signup/login layer shown | Tessera returns `PROVIDER_NOT_AUTHENTICATED` instead of fake success. |
| Claude | Blocked by provider page | Login page shown | Tessera returns `PROVIDER_NOT_AUTHENTICATED` until manual login. |
| ChatGPT | Implemented path, login dependent | Login may be required | Browser automation path exists; manual provider login is expected. |

Recent live MCP evidence:

```text
Gemini: ok=true, response="Hey there! It's great to connect with you."
Perplexity: ok=false, error.code=PROVIDER_NOT_AUTHENTICATED
Claude: ok=false, error.code=PROVIDER_NOT_AUTHENTICATED
```

Provider web interfaces change frequently. A green result means the current local session and current provider page worked during the smoke test, not that the provider will always work without login.

## Product Direction

The intended V1 shape is:

```text
User or tool client
  -> local HTTP API or MCP server
  -> packages/runtime
  -> desktop runtime bridge on 127.0.0.1:7870
  -> provider BrowserView
  -> provider web interface
```

The desktop shell owns visible provider windows and login/session lifecycle. The runtime and provider packages own execution contracts. Provider-specific DOM selectors and response capture logic live only in `packages/provider-*`.

## Startup

Install dependencies:

```bash
bun install
```

Start the desktop runtime when provider BrowserViews or MCP prompt execution are needed:

```bash
bun run dev:desktop
```

The desktop process starts the runtime bridge at:

```text
http://127.0.0.1:7870
```

Start the MCP server in a separate process when using external MCP clients:

```bash
bun run dev:mcp
```

The standalone HTTP gateway can also be started for the local compatibility surface:

```bash
bun run dev:gateway
```

## MCP Tools

The MCP server talks to `packages/runtime`, which talks to the desktop runtime bridge when a provider BrowserView is required.

| Tool | Description | Desktop Runtime Required |
|------|-------------|--------------------------|
| `list_providers` | List configured providers and current state | No |
| `get_provider_state` | Read one provider BrowserView state | Yes |
| `open_provider` | Open a provider BrowserView | Yes |
| `close_provider` | Close a provider BrowserView | Yes |
| `focus_provider` | Focus a provider pane | Yes |
| `set_layout` | Set single, split, or grid layout | Yes |
| `open_parallel_providers` | Open multiple provider panes | Yes |
| `send_prompt` | Send prompt through a provider web UI | Yes |
| `reset_provider_session` | Clear one provider session | Yes |
| `get_runtime_state` | Read desktop runtime state | Yes |

### Example MCP Flow

```json
{ "name": "open_provider", "arguments": { "providerId": "gemini" } }
```

Wait until `get_provider_state` reports `loadState: "ready"`, then:

```json
{
  "name": "send_prompt",
  "arguments": {
    "providerId": "gemini",
    "prompt": "Say hi in one short sentence."
  }
}
```

Successful normalized response:

```json
{
  "ok": true,
  "providerId": "gemini",
  "model": "gemini",
  "text": "Hey there! It's great to connect with you.",
  "loadState": "ready",
  "error": null
}
```

Blocked login response:

```json
{
  "ok": false,
  "providerId": "perplexity",
  "error": {
    "code": "PROVIDER_NOT_AUTHENTICATED",
    "message": "Perplexity is showing a signup or login layer before prompt execution.",
    "retryable": false
  }
}
```

## Provider Login Model

Tessera Gateway does not automate login, solve captchas, import cookies, scrape credentials, or bypass provider consent.

Use the provider pane normally:

1. Open the provider with `open_provider` or the desktop UI.
2. Complete login manually if the provider asks for it.
3. Leave the provider pane open.
4. Use MCP or the local runtime to send prompts.

Some providers may work without login for a while, then later require login. Tessera should report that state honestly with `PROVIDER_NOT_AUTHENTICATED`, `PROVIDER_NOT_READY`, or `PROVIDER_TIMEOUT`.

## Layout and Control

Multiple provider panes can be open at once in single, split, or grid layout. MCP calls target providers by `providerId`, not by whichever pane is visually focused. The desktop layout controls visibility and bounds; execution dispatch still uses the requested provider id.

## Error Codes

| Code | Meaning | Retryable |
|------|---------|-----------|
| `DESKTOP_RUNTIME_UNAVAILABLE` | Desktop runtime bridge is not listening | Yes |
| `PROVIDER_NOT_FOUND` | Unknown provider id | No |
| `PROVIDER_NOT_READY` | Provider page is not open, still loading, or composer is not usable | Yes |
| `PROVIDER_NOT_AUTHENTICATED` | Provider is showing login/signup/auth gate | No |
| `PROVIDER_NOT_IMPLEMENTED` | Provider path is not implemented | No |
| `PROVIDER_UI_CHANGED` | Provider DOM/capture contract appears broken | No |
| `PROVIDER_TIMEOUT` | Prompt submitted or attempted but no stable response was captured | Yes |
| `RUNTIME_ERROR` | Runtime or bridge failure | Yes |

## Verification

Default checks:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Live MCP smoke helper:

```bash
bun run apps/mcp/mcp-send-prompt-full.ts gemini
bun run apps/mcp/mcp-send-prompt-full.ts perplexity
bun run apps/mcp/mcp-send-prompt-full.ts claude
```

The desktop runtime must be running for these smoke tests.

## Project Structure

```text
apps/desktop     Electron shell, BrowserView lifecycle, local runtime bridge
apps/gateway     Fastify local HTTP compatibility surface
apps/mcp         MCP stdio server
packages/core    Shared schemas, registry, errors, normalized contracts
packages/runtime Shared orchestration and desktop bridge client
packages/provider-* Provider-owned web UI assumptions and browser automation
packages/router  Compatibility alias helpers
packages/session Session abstractions
packages/storage SQLite/Drizzle schema scaffolding
packages/security Validation and redaction helpers
packages/observability Logging helpers
tests            Unit and integration tests
docs             Architecture, provider, security, and MCP docs
```

## Documentation

- [Providers](docs/providers.md)
- [Architecture](docs/architecture.md)
- [MCP Client Configuration](docs/mcp-client-config.md)
- [Security](docs/security.md)
