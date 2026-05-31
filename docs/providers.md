# Provider Status

This document tracks provider automation status, login requirements, and current smoke evidence for Tessera Gateway.

Last verified: June 1, 2026

## Summary

| Provider | Runtime Path | Current Live Result | Login Requirement Observed | Provider-Owned Script |
|----------|--------------|---------------------|----------------------------|-----------------------|
| ChatGPT | Browser automation | Implemented, login/session dependent | Manual login may be required | `packages/provider-chatgpt/src/browserAutomation.ts` |
| Claude | Browser automation | Auth gate detected | Login required in current session | `packages/provider-claude/src/browserAutomation.ts` |
| Gemini | Browser automation | Working through MCP | No login required in current session | `packages/provider-gemini/src/browserAutomation.ts` |
| Perplexity | Browser automation | Auth gate detected | Signup/login layer shown in current session | `packages/provider-perplexity/src/browserAutomation.ts` |

The package adapters still return stub responses when called directly through the adapter interface. Real prompt execution currently happens through the desktop runtime bridge and provider-owned browser automation scripts.

## Current Smoke Evidence

Commands used with desktop runtime running:

```bash
bun run apps/mcp/mcp-send-prompt-full.ts gemini
bun run apps/mcp/mcp-send-prompt-full.ts perplexity
bun run apps/mcp/mcp-send-prompt-full.ts claude
```

Observed results:

| Provider | Result |
|----------|--------|
| Gemini | `ok: true`, response text returned |
| Perplexity | `ok: false`, `PROVIDER_NOT_AUTHENTICATED` |
| Claude | `ok: false`, `PROVIDER_NOT_AUTHENTICATED` |

Representative Gemini response:

```text
Hey there! It's great to connect with you.
```

Representative Perplexity failure:

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

Representative Claude failure:

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

## Provider Automation Contract

Provider automation must follow these rules:

- All provider DOM selectors live in the provider package.
- Desktop main may dispatch scripts but must not own provider selectors.
- Login must be manual and visible.
- Captcha solving, stealth plugins, credential scraping, cookie import, and auth bypass are forbidden.
- A provider must fail honestly when blocked by login, signup, UI changes, disabled controls, or timeout.
- No provider may return success by capturing page chrome, placeholder text, prompt echo, or unrelated page shell content.

## Provider Details

### ChatGPT

Location:

```text
packages/provider-chatgpt/
```

Runtime script:

```text
packages/provider-chatgpt/src/browserAutomation.ts
```

Current behavior:

- Uses visible BrowserView page automation.
- Detects composer and send button.
- Captures stable assistant text.
- Returns `PROVIDER_NOT_AUTHENTICATED`, `PROVIDER_NOT_READY`, or `PROVIDER_TIMEOUT` when blocked.

Login notes:

- Manual login may be required.
- Tessera must not automate credentials or import sessions.

### Claude

Location:

```text
packages/provider-claude/
```

Runtime script:

```text
packages/provider-claude/src/browserAutomation.ts
```

Current behavior:

- Opens Claude provider page through the desktop BrowserView.
- Current live session redirected to `https://claude.ai/login`.
- MCP `send_prompt` reaches the provider path and returns an honest auth failure.

Current verified response:

```text
PROVIDER_NOT_AUTHENTICATED
```

Login notes:

- Manual login is required in the current observed session.
- After login, the same MCP path should attempt composer input and response capture.

### Gemini

Location:

```text
packages/provider-gemini/
```

Runtime script:

```text
packages/provider-gemini/src/browserAutomation.ts
```

Current behavior:

- Opens `https://gemini.google.com`.
- Uses React-aware/native input setter synchronization for the composer.
- Sends prompt and captures stable response text.
- Current live smoke returned real text through MCP.

Current verified response:

```text
Hey there! It's great to connect with you.
```

Login notes:

- Gemini did not require login in the current observed session.
- Gemini may still ask for sign-in depending on geography, account state, cookies, or provider-side changes.
- If Gemini asks for sign-in, Tessera must return `PROVIDER_NOT_AUTHENTICATED` rather than bypassing it.

### Perplexity

Location:

```text
packages/provider-perplexity/
```

Runtime script:

```text
packages/provider-perplexity/src/browserAutomation.ts
```

Current behavior:

- Opens `https://www.perplexity.ai`.
- Handles the prompt composer with native input setter synchronization.
- Avoids false success from page shell, prompt echoes, and generic home-page text.
- Current live session shows a signup/login layer before prompt execution.

Current verified response:

```text
PROVIDER_NOT_AUTHENTICATED
```

Login notes:

- Perplexity may allow limited anonymous use in some sessions, but the current verified session shows a signup/login gate.
- After manual login or a non-gated provider state, the same MCP path should attempt prompt submission and answer capture.

## MCP Usage

Open a provider:

```json
{
  "name": "open_provider",
  "arguments": {
    "providerId": "gemini"
  }
}
```

Send a prompt:

```json
{
  "name": "send_prompt",
  "arguments": {
    "providerId": "gemini",
    "prompt": "Say hi in one short sentence."
  }
}
```

`send_prompt` targets by `providerId`, not by the visually focused pane. Multiple panes may be open; the requested provider id selects the BrowserView used for execution.

## Login and Session Handling

Tessera uses one isolated BrowserView session partition per provider:

```text
persist:provider-chatgpt
persist:provider-claude
persist:provider-gemini
persist:provider-perplexity
```

Users should log in manually inside the provider pane when required. Session reset is explicit through `reset_provider_session` or the desktop UI.

Do not add:

- automatic credential entry
- captcha solving
- token or cookie extraction
- imported browser profiles
- raw cookie/session logging

## Breakage Protocol

When a provider UI changes:

1. Detect the failing selector, capture method, or blocked page state.
2. Return a normalized failure code.
3. Avoid fake success from page chrome or prompt echoes.
4. Add or update focused regression tests where possible.
5. Update this document with the new observed behavior.

Preferred failure codes:

| Condition | Code |
|-----------|------|
| Provider login/signup page shown | `PROVIDER_NOT_AUTHENTICATED` |
| Composer missing or disabled | `PROVIDER_NOT_READY` |
| Prompt accepted but no stable response captured | `PROVIDER_TIMEOUT` |
| Known selector/capture contract broken | `PROVIDER_UI_CHANGED` |
| Runtime bridge failure | `RUNTIME_ERROR` |
