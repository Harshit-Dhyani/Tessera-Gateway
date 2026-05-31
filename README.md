# Tessera Gateway

A Windows-first local gateway that provides unified access to multiple AI provider web interfaces through a browser UI, local HTTP API, MCP server, and canonical runtime.

## V1 Product Direction

**Target**: one local browser-accessible gateway that can keep serving the user even when the desktop window is closed.

The desktop app is an optional operator shell for visible provider windows. It must not be the only way to use Tessera Gateway.

### V1 Startup Order

```bash
# Start the local gateway first
bun run dev:gateway

# Open the browser UI/API locally
# http://127.0.0.1:7860

# Start the MCP server in a separate terminal when needed
bun run dev:mcp

# Start the desktop app only when provider BrowserView/session controls are needed
bun run dev:desktop
```

### V1 MCP Capabilities

The MCP server communicates with the desktop's runtime bridge (port 7870) through `packages/runtime`.

**Supported MCP Tools:**
| Tool | Description | Desktop Required |
|------|-------------|------------------|
| `list_providers` | List all available providers | No |
| `get_provider_state` | Get detailed provider state | Yes |
| `open_provider` | Open a provider in the desktop app | Yes |
| `close_provider` | Close a provider | Yes |
| `focus_provider` | Focus (bring to front) a provider | Yes |
| `set_layout` | Set layout mode (single/split/grid) | Yes |
| `send_prompt` | Send prompt to provider | Yes (returns scaffold-only failure) |
| `reset_provider_session` | Reset provider session | Yes |
| `get_runtime_state` | Get current runtime state | Yes |

### V1 Limitations

1. **Provider BrowserView controls require desktop** - the browser UI/API should remain reachable without the desktop window
2. **send_prompt returns scaffold-only failure** - Prompt execution is not yet available in v1
3. **No headless execution** - Providers must be opened through the desktop UI
4. **Provider adapters remain scaffold-only** - ChatGPT, Claude, Gemini, and Perplexity are still honest stubs until browser automation is introduced

### Sample MCP Call Flow

```json
// 1. List providers
{ "name": "list_providers", "arguments": {} }

// Response:
{
  "ok": true,
  "providers": [
    { "providerId": "chatgpt", "displayName": "ChatGPT", "loadState": "idle", ... }
  ]
}

// 2. Open ChatGPT
{ "name": "open_provider", "arguments": { "providerId": "chatgpt" } }

// 3. Get state
{ "name": "get_provider_state", "arguments": { "providerId": "chatgpt" } }

// Response (example):
{
  "ok": true,
  "state": {
    "providerId": "chatgpt",
    "loadState": "ready",
    "isLoggedIn": false,
    "currentUrl": "https://chat.openai.com",
    ...
  }
}

// 4. Send prompt (returns scaffold-only failure in v1)
{ "name": "send_prompt", "arguments": { "providerId": "chatgpt", "prompt": "hello" } }

// Response:
{
  "ok": false,
  "providerId": "chatgpt",
  "error": {
    "code": "PROVIDER_NOT_IMPLEMENTED",
    "message": "Provider automation is scaffold-only in this phase.",
    "retryable": false
  }
}
```

### Gateway Status

The HTTP Gateway (`apps/gateway`) uses the shared runtime orchestration layer and returns normalized responses. It is a local compatibility surface for OpenAI-compatible API clients, not a second orchestration system.

### Architecture

```
Browser UI / MCP Client / API Client
    ↓
apps/gateway / apps/mcp
    ↓
packages/runtime (orchestration layer)
    ↓ optional local bridge
apps/desktop (provider BrowserView management)
```

### Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `DESKTOP_RUNTIME_UNAVAILABLE` | Desktop not running | No |
| `PROVIDER_NOT_FOUND` | Unknown provider | No |
| `PROVIDER_NOT_READY` | Provider not open/loading | Yes |
| `PROVIDER_NOT_AUTHENTICATED` | Not logged in | No |
| `PROVIDER_NOT_IMPLEMENTED` | Scaffold-only prompt path | No |
| `PROVIDER_UI_CHANGED` | Provider capture is broken | No |
| `PROVIDER_EXECUTION_FAILED` | Provider execution failed | Yes |
| `RUNTIME_ERROR` | Internal error | Yes |

---

## Project Overview

### V1 Scope

| What V1 Supports | What V1 Does NOT Support |
|------------------|-------------------------|
| ✅ Electron desktop shell | ❌ Real headless prompt execution |
| ✅ Local HTTP API (port 7860) | ❌ Multi-provider parallel execution |
| ✅ MCP server with tools | ❌ Production deployment |
| ✅ Provider browser views | ❌ Advanced routing |
| ✅ Desktop runtime bridge (port 7870) | ❌ Full session automation |

### Architecture Overview

```
User/Tool → Local HTTP API / MCP Server
              ↓
         packages/runtime
              ↓
     Desktop Runtime Bridge (port 7870)
              ↓
     Provider View Manager → BrowserView → Provider Web UI
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Gateway | `apps/gateway` | Fastify local API and browser-accessible runtime surface |
| Desktop App | `apps/desktop` | Optional Electron shell + provider BrowserView controls |
| MCP Server | `apps/mcp` | Model Context Protocol |
| Runtime | `packages/runtime` | Canonical orchestration layer |
| Core | `packages/core` | Shared types, registry |

## Quick Start

```bash
# Install dependencies
bun install

# Run HTTP gateway/browser surface
bun run dev:gateway

# Run MCP server (in separate terminal)
bun run dev:mcp

# Run desktop app only when provider windows are needed
bun run dev:desktop
```

## Verification

```bash
bun run typecheck
bun run test
```

## Project Structure

```
/
├── apps/
│   ├── desktop/      # Electron app + runtime bridge
│   ├── gateway/     # Fastify API (runtime-backed compatibility surface)
│   └── mcp/         # MCP server
├── packages/
│   ├── core/        # Shared types, registry
│   ├── runtime/     # Canonical orchestration layer
│   ├── router/      # Legacy routing compatibility helpers
│   ├── session/     # Session management
│   ├── storage/    # SQLite/Drizzle
│   ├── observability/# Logging
│   ├── security/   # Validation
│   └── provider-*/  # 4 provider adapters
├── tests/           # Unit, integration, e2e
├── docs/            # Architecture, security, providers
└── scripts/         # Dev and build scripts
```

## Documentation

- [MCP Client Configuration](docs/mcp-client-config.md) - How to configure MCP clients
- [Architecture](docs/architecture.md) - System design
- [Security](docs/security.md) - Trust boundaries
- [Providers](docs/providers.md) - Provider status

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun, Node 20.x |
| Desktop | Electron 28+ |
| UI | React, Vite, Tailwind |
| API | Fastify |
| MCP | @modelcontextprotocol/sdk |
| Validation | Zod |
| Logging | Pino |

## Requirements

- Windows 10+
- Bun (latest)
- Node 20.x (for Electron/Playwright compatibility)
