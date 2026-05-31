# MCP Server Configuration

This document describes how to configure external MCP clients to connect to the Tessera Gateway MCP server.

## Architecture Overview

```
External MCP Client (Codex, OpenCode, etc.)
            ↓
    apps/mcp (stdio server)
            ↓
    packages/runtime (shared API)
            ↓
    Desktop Runtime (port 7870)
            ↓
    Provider Browser Views
```

## V1 Limitations

- **Desktop app must be running** - MCP server requires the desktop app to be running
- **No headless execution** - `send_prompt` requires a UI-attached provider BrowserView
- **Manual login may be required** - Claude, ChatGPT, and Perplexity can show provider login/signup gates
- **Provider UI changes can break capture** - provider scripts fail honestly instead of returning fake success

## Starting the MCP Server

The MCP server is started via stdio. It communicates with the desktop app's runtime server on port 7870.

```bash
# Start desktop app first (this starts the runtime server on port 7870)
bun run --filter @tessera-gateway/desktop dev

# In another terminal, start the MCP server
bun run --filter @tessera-gateway/mcp dev

# Or run MCP directly
cd apps/mcp && bun run src/index.ts
```

## Client Configurations

### For Codex

```json
{
  "mcpServers": {
    "tessera-gateway": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "env": {},
      "cwd": "/path/to/Local-Multi-AI-Interface-Gateway/apps/mcp"
    }
  }
}
```

### For OpenCode

In your OpenCode configuration:

```json
{
  "mcpServers": {
    "tessera-gateway": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/path/to/Local-Multi-AI-Interface-Gateway/apps/mcp"
    }
  }
}
```

### For Claude Desktop

Create or edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tessera-gateway": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "env": {},
      "workingDirectory": "/path/to/Local-Multi-AI-Interface-Gateway/apps/mcp"
    }
  }
}
```

### Generic MCP Client

```json
{
  "command": "bun",
  "args": ["run", "src/index.ts"],
  "workingDirectory": "/absolute/path/to/Local-Multi-AI-Interface-Gateway/apps/mcp"
}
```

## MCP Tools Reference

| Tool | Description | Desktop Required |
|------|-------------|------------------|
| `list_providers` | List all available providers | No |
| `get_provider_state` | Get detailed state of a provider | Yes |
| `open_provider` | Open a provider in the desktop app | Yes |
| `close_provider` | Close a provider | Yes |
| `focus_provider` | Focus (bring to front) a provider | Yes |
| `set_layout` | Set layout mode (single/split/grid) | Yes |
| `open_parallel_providers` | Open multiple providers | Yes |
| `send_prompt` | Send prompt to provider | Yes (and provider must be open) |
| `reset_provider_session` | Reset provider session | Yes |
| `get_runtime_state` | Get current runtime state | Yes |

## Example Usage

### 1. List Providers

```json
{
  "name": "list_providers",
  "arguments": {}
}
```

Response:
```json
{
  "ok": true,
  "providers": [
    {
      "providerId": "chatgpt",
      "displayName": "ChatGPT",
      "aliases": ["gpt", "openai", "chatgpt"],
      "capabilities": { "streaming": true, "vision": true, "codeExecution": true },
      "status": "stubbed",
      "authMethod": "browser",
      "isLoggedIn": false,
      "isVisible": false,
      "isActive": false,
      "isFocused": false,
      "loadState": "idle"
    }
    // ... other providers
  ]
}
```

### 2. Open Provider

```json
{
  "name": "open_provider",
  "arguments": {
    "providerId": "chatgpt"
  }
}
```

### 3. Send Prompt

```json
{
  "name": "send_prompt",
  "arguments": {
    "providerId": "chatgpt",
    "prompt": "Hello, how are you?"
  }
}
```

**Note**: `send_prompt` now uses real visible-browser automation for implemented providers. The provider must be open, loaded, and not blocked by a login/signup gate. Some providers can work without login in one session and require login later.

Current verified behavior on June 1, 2026:

| Provider | Observed MCP Result |
|----------|---------------------|
| Gemini | `ok: true`, response text returned |
| Perplexity | `PROVIDER_NOT_AUTHENTICATED` due signup/login layer |
| Claude | `PROVIDER_NOT_AUTHENTICATED` due login page |
| ChatGPT | implemented path, manual login may be required |

Successful Gemini response shape:

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

Auth-gated provider response shape:

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

### 4. Get Runtime State

```json
{
  "name": "get_runtime_state",
  "arguments": {}
}
```

Response:
```json
{
  "ok": true,
  "desktopAvailable": true,
  "currentLayout": "single",
  "openProviders": ["chatgpt"],
  "visibleProviders": ["chatgpt"],
  "focusedProvider": "chatgpt",
  "activeProvider": "chatgpt",
  "providersScreenActive": true
}
```

## Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `DESKTOP_RUNTIME_UNAVAILABLE` | Desktop app not running | No |
| `PROVIDER_NOT_FOUND` | Unknown provider ID | No |
| `PROVIDER_NOT_AUTHENTICATED` | Provider session not logged in | No |
| `PROVIDER_NOT_READY` | Provider not open, still loading, or composer not usable | Yes |
| `PROVIDER_TIMEOUT` | Prompt path did not capture a stable response | Yes |
| `PROVIDER_UI_CHANGED` | Provider page/capture contract changed | No |
| `VALIDATION_ERROR` | Invalid input parameters | No |
| `RUNTIME_ERROR` | Internal runtime error | Yes |

## Troubleshooting

### Desktop Runtime Unavailable

```
Error: Desktop app is not running
```

**Solution**: Start the desktop app first (`bun run --filter @tessera-gateway/desktop dev`)

### Provider Not Ready

```
Error: Provider not open. Call open_provider first.
```

**Solution**: Call `open_provider` before trying to interact with the provider.

### Provider Not Authenticated

```
Error: Provider session not authenticated
```

**Solution**: Open the provider in the desktop app and log in through the provider's normal browser interface. Tessera does not automate login, captcha, cookies, or credentials.

### Desktop Runtime Exits Immediately

If launching the desktop app hidden causes the runtime to start and then exit, start the desktop app visibly:

```bash
bun run dev:desktop
```

The provider BrowserView window lifecycle must remain alive while MCP prompt execution runs.
