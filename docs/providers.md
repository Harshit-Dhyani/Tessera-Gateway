# Provider Status

This document tracks the status of each supported AI provider.

## Overview

| Provider | Status | V1 Support | Notes |
|----------|--------|------------|-------|
| ChatGPT | 🏗️ Stub | Placeholder | Returns "not implemented" |
| Claude | 🏗️ Stub | Placeholder | Returns "not implemented" |
| Gemini | 🏗️ Stub | Placeholder | Returns "not implemented" |
| Perplexity | 🏗️ Stub | Placeholder | Returns "not implemented" |

## Provider Interface

All providers implement the `IProviderAdapter` interface:

```typescript
interface IProviderAdapter {
  execute(request: ChatRequest): Promise<ChatResponse>;
  getHealth(): Promise<ProviderHealth>;
  getMetadata(): ProviderMetadata;
}
```

## ChatGPT (OpenAI)

### Adapter Location
`packages/provider-chatgpt/`

### Status: STUB (V1)

**Current behavior**:
```typescript
{
  ok: false,
  providerId: "chatgpt",
  model: "chatgpt",
  text: "",
  latencyMs: 0,
  loadState: "failed",
  error: {
    code: "PROVIDER_NOT_IMPLEMENTED",
    message: "Provider automation is scaffold-only in this phase.",
    retryable: false
  }
}
```

### V1 Limitations

- No browser automation
- No login flow
- No response capture
- No session management

### Smoke Test Checklist

- [ ] Adapter package builds
- [ ] Schema validation passes
- [ ] Health check returns degraded status
- [ ] Execute returns stub response

### Expected V2 Requirements

- Playwright persistent context
- Provider-owned DOM selectors
- Response capture selector
- Login state detection
- Honest failure handling for UI changes

---

## Claude (Anthropic)

### Adapter Location
`packages/provider-claude/`

### Status: STUB (V1)

**Current behavior**:
```typescript
{
  ok: false,
  providerId: "claude",
  model: "claude",
  text: "",
  latencyMs: 0,
  loadState: "failed",
  error: {
    code: "PROVIDER_NOT_IMPLEMENTED",
    message: "Provider automation is scaffold-only in this phase.",
    retryable: false
  }
}
```

### V1 Limitations

Same as ChatGPT - stub only.

### Smoke Test Checklist

- [ ] Adapter package builds
- [ ] Schema validation passes
- [ ] Health check returns degraded status
- [ ] Execute returns stub response

### Expected V2 Requirements

- Playwright persistent context
- DOM selector patterns
- Response capture logic
- Session persistence

---

## Gemini (Google)

### Adapter Location
`packages/provider-gemini/`

### Status: STUB (V1)

**Current behavior**:
```typescript
{
  ok: false,
  providerId: "gemini",
  model: "gemini",
  text: "",
  latencyMs: 0,
  loadState: "failed",
  error: {
    code: "PROVIDER_NOT_IMPLEMENTED",
    message: "Provider automation is scaffold-only in this phase.",
    retryable: false
  }
}
```

### V1 Limitations

Same as ChatGPT - stub only.

### Smoke Test Checklist

- [ ] Adapter package builds
- [ ] Schema validation passes
- [ ] Health check returns degraded status
- [ ] Execute returns stub response

### Expected V2 Requirements

- Playwright persistent context
- DOM selector patterns
- Response capture logic

---

## Perplexity

### Adapter Location
`packages/provider-perplexity/`

### Status: STUB (V1)

**Current behavior**:
```typescript
{
  ok: false,
  providerId: "perplexity",
  model: "perplexity",
  text: "",
  latencyMs: 0,
  loadState: "failed",
  error: {
    code: "PROVIDER_NOT_IMPLEMENTED",
    message: "Provider automation is scaffold-only in this phase.",
    retryable: false
  }
}
```

### V1 Limitations

Same as ChatGPT - stub only.

### Smoke Test Checklist

- [ ] Adapter package builds
- [ ] Schema validation passes
- [ ] Health check returns degraded status
- [ ] Execute returns stub response

### Expected V2 Requirements

- Playwright persistent context
- DOM selector patterns
- Response capture logic
- Search-specific UI handling

---

## Adding New Providers

To add a new provider:

1. Create package: `packages/provider-<name>/`
2. Implement `IProviderAdapter` interface
3. Add to router mapping
4. Create smoke test
5. Document in this file

New provider additions must also update `packages/core/src/providers/registry.ts` and the canonical runtime state contract.

## Provider Breakage Protocol

When a provider's web interface changes:

1. **Detect**: Log which selector/capture failed
2. **Disable**: Mark provider as `degraded` in health check
3. **Fallback**: Log what fallback was used
4. **Test**: Add regression test if possible
5. **Document**: Update this file with breakage notes

**Do NOT**:
- Fake success
- Silently skip
- Hide the failure
- Return a provider-shaped success object when the adapter is only scaffolded

## Health Check Response Format

Health is normalized through `packages/core` and `packages/runtime`.
Provider adapters may return stubbed health, but they must not report fake healthy status when execution is scaffold-only.

## Model Alias Mapping

| Alias | Provider | Fallback |
|-------|----------|----------|
| `chatgpt` | ChatGPT | error (no fallback in V1) |
| `claude` | Claude | error |
| `gemini` | Gemini | error |
| `perplexity` | Perplexity | error |
| `auto` | First available runtime provider | explicit runtime selection |

`auto` is resolved by the shared runtime orchestration layer. It is not a hidden multi-provider fallback chain.
