# MCP Usage and Client Configuration

This document explains how to use Tessera Gateway through MCP, including quick
local commands, external client configuration, tool arguments, provider login
rules, and troubleshooting.

## Architecture Overview

```text
External MCP Client (Codex, OpenCode, etc.)
            |
    apps/mcp (stdio server)
            |
    packages/runtime (shared API)
            |
    Desktop Runtime (port 7870)
            |
    Provider Browser Views
```

The MCP server does not talk to provider websites directly. It calls the shared
runtime, and the runtime calls the desktop runtime bridge at
`http://127.0.0.1:7870`.

## V1 Limitations

- **Desktop app must be running** - MCP server requires the desktop app to be running
- **No headless execution** - `send_prompt` requires a UI-attached provider BrowserView
- **Manual login may be required** - Claude, ChatGPT, and Perplexity can show provider login/signup gates
- **Provider UI changes can break capture** - provider scripts fail honestly instead of returning fake success

## Quick Start

Terminal 1: start the desktop runtime.

```bash
bun run dev:desktop
```

Terminal 2: send a prompt through MCP.

```bash
bun run mcp gemini "Hello, how are you?"
```

Provider-specific shortcuts are also available:

```bash
bun run mcp:gemini "Hello, how are you?"
bun run mcp:perplexity "Search for the latest AI browser automation risks."
bun run mcp:claude "Summarize this in one sentence."
bun run mcp:chatgpt "Write a short checklist."
```

The generic form is:

```bash
bun run mcp <providerId> "<prompt>"
```

Supported provider ids:

```text
chatgpt
claude
gemini
perplexity
```

Examples:

```bash
bun run mcp gemini "hello dwadawdad"
bun run mcp perplexity "What should I check before trusting a provider smoke test?"
bun run mcp claude "Write a one-line summary of Tessera Gateway."
bun run mcp chatgpt "Give me a tiny release checklist."
```

## What the Shortcut Does

`bun run mcp ...` runs:

```bash
bun run apps/mcp/mcp-send-prompt-full.ts <providerId> "<prompt>"
```

The helper:

- starts the MCP stdio server as a child process
- calls `open_provider`
- waits briefly for provider load
- calls `get_provider_state`
- calls `send_prompt` with your prompt
- prints the normalized result

Expected successful shape:

```text
Testing send_prompt via MCP...

1. Opening gemini...
   success: true
   isMounted: true
   loadState: ready

2. Checking gemini state...
   isMounted: true
   loadState: ready
   currentUrl: https://gemini.google.com/

3. Sending prompt to gemini...
   prompt: hello dwadawdad
   ok: true
   response: ...
```

If the provider is blocked by login, timeout, or UI changes, the helper should
print `ok: false` with a machine-readable error code.

## Starting the MCP Server for External Clients

External MCP clients start `apps/mcp/src/index.ts` over stdio. The desktop app
must be running first because provider execution needs the runtime bridge on
port `7870`.

```bash
bun run dev:desktop
```

In another terminal, you can test the raw MCP server:

```bash
bun run dev:mcp
```

Or run MCP directly from the app folder:

```bash
cd apps/mcp
bun run src/index.ts
```

## Client Configurations

### For Codex

Use an absolute path to this repo's MCP app folder.

```json
{
  "mcpServers": {
    "tessera-gateway": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "env": {},
      "cwd": "D:/Programming/Engineering Workspace/Web & Application Development/Desktop Softwares/All/apps/mcp"
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
      "cwd": "D:/Programming/Engineering Workspace/Web & Application Development/Desktop Softwares/All/apps/mcp"
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
      "workingDirectory": "D:/Programming/Engineering Workspace/Web & Application Development/Desktop Softwares/All/apps/mcp"
    }
  }
}
```

### Generic MCP Client

```json
{
  "command": "bun",
  "args": ["run", "src/index.ts"],
  "workingDirectory": "D:/Programming/Engineering Workspace/Web & Application Development/Desktop Softwares/All/apps/mcp"
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
| `send_prompt` | Send prompt to provider | Yes |
| `reset_provider_session` | Reset provider session | Yes |
| `get_runtime_state` | Get current runtime state | Yes |

`send_prompt` targets providers by `providerId`, not by whichever pane is
visually focused. Multiple provider panes can be open at once; MCP still
dispatches to the requested provider.

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
    "providerId": "gemini"
  }
}
```

### 3. Check Provider State

```json
{
  "name": "get_provider_state",
  "arguments": {
    "providerId": "gemini"
  }
}
```

### 4. Send Prompt

```json
{
  "name": "send_prompt",
  "arguments": {
    "providerId": "gemini",
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

### 5. Get Runtime State

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

## Prompt Quoting

Use quotes around prompts that contain spaces:

```bash
bun run mcp gemini "hello how are you"
```

PowerShell, Command Prompt, and Bash all pass the quoted text as one prompt.
Without quotes, the helper joins the remaining arguments with spaces, so this
also works:

```bash
bun run mcp gemini hello how are you
```

Prefer quotes because they preserve punctuation and make command history easier
to read.

## Provider Login Behavior

Tessera Gateway does not automate login. If a provider asks for sign-in:

1. Open the provider pane through the desktop app or MCP `open_provider`.
2. Log in manually in the visible provider page.
3. Leave the desktop runtime running.
4. Retry the same MCP command.

Expected auth-gated response:

```json
{
  "ok": false,
  "providerId": "claude",
  "error": {
    "code": "PROVIDER_NOT_AUTHENTICATED",
    "message": "Claude requires manual sign-in before prompt execution.",
    "retryable": false
  }
}
```

Tessera must not solve captchas, fill credentials automatically, import browser
cookies, or bypass provider login gates.

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

Short command:

```bash
bun run dev:desktop
```

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

### Provider Timeout

```
Error: Timed out waiting for a stable Gemini response.
```

**Meaning**: The prompt path ran, but Tessera did not capture a stable provider
answer before the timeout. This can happen if the provider page is slow, stuck,
offline, or the UI changed.

**Solution**: Check the visible provider pane, refresh or reopen the provider,
then retry:

```bash
bun run mcp:gemini "hello again"
```

### Runtime Error

```
Error: Unable to connect. Is the computer able to access the url?
```

**Meaning**: The provider page or Electron BrowserView reported a runtime-level
navigation or network failure.

**Solution**: Confirm the desktop app is still running, the provider page loads
visibly, and the machine can access the provider URL in the same session.

### Desktop Runtime Exits Immediately

If launching the desktop app hidden causes the runtime to start and then exit, start the desktop app visibly:

```bash
bun run dev:desktop
```

The provider BrowserView window lifecycle must remain alive while MCP prompt execution runs.

## Developer Verification Checklist

For MCP-only docs or helper changes:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

For live provider changes, also run one or more:

```bash
bun run mcp:gemini "hello"
bun run mcp:perplexity "hello"
bun run mcp:claude "hello"
bun run mcp:chatgpt "hello"
```

Report the real result. A login gate or timeout is valid evidence if the error
code is honest and machine-readable.
