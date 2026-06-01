# AGENTS.md

# Tessera Gateway Repository Contract

This file defines the working contract for this repository.

The project goal is not to build a generic chatbot.
The project goal is to build a local desktop gateway that uses real provider web interfaces, exposes one local API plus MCP tools, and routes tasks across multiple AI providers through one controlled runtime.

These rules are merge-blocking.
If a change violates this contract, it is incomplete until corrected.

## 1. Project Identity

Project name: Tessera Gateway

Primary goal:
Build a Windows-first local gateway that lets a user control multiple AI providers from one local runtime through:

* one browser-accessible local UI
* one local HTTP API
* one MCP server
* one shared routing engine
* one optional visible desktop session manager for provider web interfaces

Measurable outcome:
A user can open Tessera Gateway from a normal browser on loopback, log into supported providers once, send one request through the local gateway, and receive a normalized response from the selected provider or routing mode.

Time horizon:
V1 only.

Single success metric:
A cold-started local install can complete one end-to-end request successfully through each supported provider and through MCP, with logs proving provider selection, latency, and result capture.

Failure conditions:

* closing the desktop window makes the browser UI, local API, or MCP surface unusable
* provider sessions are unreliable or frequently break after restart
* MCP tools do not reflect the real runtime contract
* the local API and MCP paths diverge in behavior
* session persistence is unsafe or unclear
* the system requires hidden manual recovery for normal use
* the product depends on anti-detection hacks, stealth plugins, captcha bypass, or credential scraping

## 2. V1 Product Reality

This is a local desktop automation system, not a hosted SaaS gateway.

V1 is:

* Windows-first
* local-only by default
* browser-accessible over loopback
* personal-use oriented
* human-login based
* experimental
* router and tooling focused

V1 is not:

* a cloud service
* a multi-tenant platform
* a billing product
* a stealth browser bot
* an anti-detection framework
* an agent swarm platform
* a production compliance product

Do not pretend V1 is broader than it is.

## 3. Canonical Stack Decisions

These are the hard stack choices for V1.
Use them unless a change is explicitly approved and justified.

### Runtime and packaging

* Bun as the primary package manager, script runner, and workspace tool
* Node.js compatibility is still required where Electron, Playwright, or ecosystem tooling depends on Node runtime behavior
* Electron for desktop shell and native app lifecycle
* electron-builder for packaging

### Language and UI

* TypeScript everywhere unless native code is unavoidable
* React + Vite for desktop UI
* Tailwind CSS for styling
* Zustand for local UI state only

### Browser automation

* Playwright is the canonical browser automation layer
* persistent Chromium contexts per provider
* visible login flow by default
* optional headless execution only after a provider has been successfully authenticated in a visible session

### Local server and contracts

* Fastify for the local HTTP API
* official Model Context Protocol TypeScript SDK for MCP server
* Zod for input validation and schema ownership
* Server-Sent Events for streaming output in V1

### Local persistence and secrets

* SQLite is canonical local persistence for V1
* Drizzle ORM for schema and migrations
* OS keychain storage for secrets when possible
* provider browser profiles stored in dedicated app-owned directories only

### Observability and logging

* Pino for structured logs
* local metrics and request history persisted in SQLite
* no silent failure paths

### Testing

* Vitest for unit and integration tests
* Playwright for end-to-end and provider-surface smoke tests
* contract tests for MCP and local API parity

### Explicit non-choices for V1

* no Postgres
* no Redis
* no Next.js
* no hosted backend
* no unofficial stealth plugin stack
* no fingerprint spoofing layer
* no captcha solving
* no automatic login bypass

## 4. Architecture Summary

The canonical V1 shape is:

User or tool client -> local HTTP API or MCP server -> routing engine -> provider automation adapter -> Playwright browser context -> provider web interface

Browser UI is the primary local operator surface for:

* provider status
* routing preferences
* logs
* local settings
* local API and MCP configuration display

Desktop UI is an optional separate surface that controls:

* login state
* window visibility
* session lifecycle
* provider BrowserView lifecycle

The desktop UI must never become the source of truth for provider execution logic.

## 5. Repository Shape

Target ownership for this repo:

* `apps/desktop` -> Electron shell, React UI, settings surfaces, provider visibility controls
* `apps/gateway` -> local Fastify API and routing runtime
* `apps/mcp` -> MCP server surface only
* `packages/core` -> shared request and response types, enums, validation, routing contracts
* `packages/router` -> model aliases, provider selection, fallback logic, health policy
* `packages/provider-*` -> one provider adapter per provider
* `packages/session` -> persistent context lifecycle, profile ownership, login state checks
* `packages/storage` -> Drizzle schema, SQLite access, migrations
* `packages/observability` -> logging, metrics, tracing helpers
* `packages/security` -> boundary validation, path checks, allowlists, secret handling
* `tests` -> regression, contract, integration, e2e, smoke

Treat paths as target structure until verified in repo reality.

## 6. Core Product Boundaries

### Canonical source of truth

* SQLite is canonical for app state, request history, routing history, settings, and provider health snapshots
* Playwright persistent browser profiles are canonical for browser session state
* Zod schemas are canonical for transport validation
* shared package types and contracts are canonical for request and response shapes

### Forbidden

* no business logic duplicated across desktop, gateway, and MCP surfaces
* no UI-only authorization or session assumptions
* no hardcoded provider-specific selectors outside provider adapter ownership
* no ad-hoc request shaping in route handlers
* no scattered settings ownership
* no fake status indicators
* no silent fallback that hides which provider actually answered

## 7. Provider Automation Contract

This repository intentionally uses provider web interfaces instead of official model APIs.
That raises fragility and trust-boundary risk.

Because of that, the following rules are strict:

* user login must be human-initiated in a visible browser context
* do not automate captcha solving
* do not implement stealth or fingerprint spoofing to evade anti-bot systems
* do not import stolen cookies, tokens, or sessions
* do not scrape credentials from external browsers
* do not bypass provider consent or login challenges
* do not expose raw provider cookies or tokens through logs, UI, or API responses
* provider adapters must fail honestly when a provider UI changes or capture is no longer reliable
* provider-specific DOM selectors, response capture rules, and readiness checks must live in provider-owned modules only
* if a provider becomes unstable, disable it explicitly rather than silently degrading everything

## 8. Session and Profile Contract

Browser session handling is security-sensitive.

Rules:

* one isolated Playwright persistent context per provider
* one app-owned user-data directory per provider
* no shared browser profile between providers
* no reading from the user’s normal Chrome or Edge profile
* clear session lifecycle commands: initialize, login-check, reset, wipe
* destructive session actions must require explicit user confirmation in UI
* session reset must not destroy unrelated app state
* session state must be inspectable without leaking secrets
* any export or backup feature for profiles is forbidden in V1

## 9. Router Contract

The router decides provider selection and fallback behavior.
It must remain explicit, observable, and testable.

Required in V1:

* direct provider selection
* model alias support such as `chatgpt`, `claude`, `gemini`, `perplexity`, `auto`
* health-aware fallback policy
* latency logging
* normalized response metadata
* provider selection visibility in logs and API output

Forbidden in V1:

* hidden cross-provider prompt rewriting beyond documented task wrappers
* undocumented retry loops
* routing by guesswork with no logs
* fake “best model” claims without measurable policy

## 10. MCP and Local API Parity Contract

The MCP server and local HTTP API are two surfaces over the same core runtime.
They must not drift.

Required:

* both surfaces call the same underlying routing engine
* shared schemas for tool inputs and API request shapes where appropriate
* shared response normalization rules
* a parity test for every important task family
* one canonical owner per task wrapper

If a task exists in MCP and in the local API, it must use the same core implementation unless the difference is intentional and documented.

## 11. Task Wrapper Contract

Task wrappers may exist for user convenience.
Examples include search, summarize, compare, translate, code review, and ask-all.

Rules:

* wrappers must be thin and explicit
* wrappers must not become a second hidden router
* wrappers must live above provider adapters, not inside them
* wrappers must disclose which provider or providers were used
* wrappers must preserve raw provider result metadata where useful
* wrappers must not fabricate citations, sources, or confidence

## 12. Security Contract

Security issues block merge.

Every meaningful change must consider:

* local privilege exposure
* unsafe file access
* path traversal
* shell injection
* prompt injection from file or web content
* unsafe URL handling
* SSRF through analysis tools
* secret leakage
* session leakage
* localhost surface abuse
* unbounded retries
* unbounded logs and storage growth
* fail-open provider routing

Required:

* strict input validation at transport boundaries
* allowlists for file access and URL-capable tools
* loopback-only network binding by default
* bounded retries and bounded timeouts
* safe temp-file handling
* redaction of secrets and session identifiers in logs
* startup validation for critical config

Forbidden:

* `shell: true`
* arbitrary file-system passthrough
* unrestricted URL fetch proxying
* wildcard trust of local callers without clear auth model
* exposing raw browser DevTools endpoints
* raw session/token dump features

## 13. Localhost Exposure Contract

Because this app exposes a local API and MCP surface, local boundary safety matters.

Rules:

* default bind address is loopback only
* any non-loopback binding must be explicit and clearly marked experimental
* CORS must be deliberate, never broad by accident
* high-risk endpoints must require local auth or local trust configuration if they are callable outside the desktop app
* document clearly which surfaces are intended for human use, IDE use, or automation use

## 14. File and URL Tool Safety Contract

Tools that read local files or remote URLs are high risk.

Rules:

* local file access must be explicitly requested by the caller
* allowed paths must be validated before reading
* recursive wide-open file crawling is forbidden in V1
* remote URL tools must validate protocol and target rules
* internal network targets and local metadata endpoints must be blocked unless a reviewed exception exists
* fetched content must be size-bounded and timeout-bounded
* file contents sent to providers must be user-visible or logged in request metadata

## 15. Streaming Contract

Streaming must be honest.

Rules:

* downstream streaming must reflect real upstream capture state
* do not emit fake token cadence when capture is batch-based
* if a provider cannot support true streaming in the current implementation, expose chunked or final mode honestly
* cancellation and timeout behavior must be explicit
* partial responses must be marked as partial

## 16. Desktop UI Contract

The browser UI is the primary operator surface. The desktop app is a provider-window shell, not the product brain.

Closing the desktop window must not stop the gateway, browser UI, local API, or MCP process. If a feature requires desktop-only BrowserView access, it must return an explicit unavailable/not-ready response rather than making the whole product unusable.

The browser UI must own:

* provider health and status display
* settings management
* logs viewer
* local API and MCP configuration display

The desktop UI may own:

* login surfaces
* session reset controls
* provider BrowserView visibility
* provider window lifecycle
* headless toggle if supported

No UI surface may own:

* routing logic
* provider adapter logic
* secret parsing
* core normalization logic

If a UI control is visible, it must map to real runtime behavior.
No placebo toggles.

Runtime-driven provider opens, including MCP and local HTTP API calls, must switch the renderer to the Providers screen and mount provider BrowserViews into a valid workspace. A provider may not be marked open/visible while it is missing layout ownership or workspace bounds. If bounds are not available yet, the desktop runtime must create safe default bounds or return an explicit not-ready state.

### Planned vs Real UI

Any planned or non-functional control must be visibly labeled:

* `planned` - feature coming later
* `disabled` - temporarily disabled
* `not implemented` - V1 placeholder

No clickable control may pretend to affect provider state if it does not.
Status indicators must come from runtime truth, not mock frontend state.
Fake "working" indicators are forbidden.

## 17. Settings and Config Contract

Settings require one source of truth.

Rules:

* all settings must be schema-defined
* one canonical defaults owner
* migrations required for settings rename or shape change
* sensitive settings separated from general preferences
* UI forms must be generated from or validated against shared config contracts where feasible
* experimental flags must be labeled and scoped clearly

## 18. Observability Contract

A local gateway without observability is not debuggable.

Required:

* structured logs
* request IDs
* provider name
* alias used
* route/task used
* latency
* retry/fallback events
* capture method used when relevant
* final result state

Logs must not contain:

* raw cookies
* auth tokens
* full sensitive file contents
* secrets
* private session identifiers that can be replayed

## 19. Testing Contract

Required test classes for this repo:

* unit tests for shared logic, schemas, selectors, and adapters
* integration tests for gateway routes, router behavior, settings, and storage
* contract tests for MCP and local API parity
* regression tests for every confirmed provider breakage or routing bug
* end-to-end tests for login state detection, request flow, and basic desktop integration where feasible

Rules:

* provider-specific changes require provider-focused tests
* routing changes require fallback-path tests
* localhost boundary changes require auth and bind tests
* file/URL tool changes require abuse-case tests
* bug fixes require at least one focused regression test
* helper-only tests are not enough for route or contract bugs

## 20. Verification Commands

For meaningful changes, run the smallest relevant set plus report limits honestly.

Default verification target:

* `bun install`
* `bun run lint`
* `bun run typecheck`
* `bun run test`
* `bun run build`

When provider behavior changes, also run:

* targeted provider adapter tests
* MCP parity tests
* one desktop or end-to-end smoke path when the environment allows it

Never say fixed if verification is partial.
State what was verified and what still needs runtime confirmation.

## 21. Change Discipline

All agents must follow:

* discovery before editing
* no path guessing
* minimal diffs
* verify before claiming
* preserve ownership boundaries
* search for existing helpers before adding new ones
* do not refactor unrelated code in bug-fix batches

Use these markers when needed:
`[ASSUMPTION: ...]`
`[UNVERIFIED: ...]`

## 22. High-Risk Areas

High-risk changes include:

* provider session lifecycle
* login detection
* response capture logic
* browser profile ownership
* URL and file tools
* localhost exposure
* MCP tool execution
* routing and fallback
* secrets and logs
* settings migration
* desktop-to-runtime bridging

High-risk changes need stronger tests and stricter verification.

## 23. Definition of Done

A task is complete only if:

* the correct layer was changed
* the root cause was addressed
* schema and contract ownership remain clean
* no new secret or session leakage risk was introduced
* tests were added or updated appropriately
* build passes or limits are called out clearly
* runtime behavior was verified where feasible
* MCP and local API surfaces remain aligned
* unresolved uncertainty is explicitly labeled

## 24. Required Agent Response Format

For non-trivial work in this repo, respond using:

1. Assumptions
2. Plan
3. Findings
4. Changes
5. Verification
6. Risks or Deferred
7. Done-When

## 25. Repository Memory and AGENTS Update Rule

This file must evolve with the project.
Do not let repeated mistakes stay as tribal knowledge.

Rules:

* whenever a confirmed bug, recurring issue, security vulnerability, architecture drift pattern, or unsafe workflow appears more than once, update `AGENTS.md` in the same batch or explicitly explain why no update is needed
* whenever a new subsystem, tool surface, provider adapter, session flow, storage pattern, or security-sensitive feature is added, review whether `AGENTS.md` needs new rules, boundaries, verification steps, or regression-prevention guidance
* if a fix reveals a missing invariant, missing ownership rule, missing test expectation, or missing security guardrail, encode that lesson into `AGENTS.md`, tests, shared validation, or CI checks rather than leaving it as memory only
* repeated failures must result in stronger permanent prevention, not just another local patch
* do not update `AGENTS.md` with vague noise; only add concrete rules that prevent the same class of mistake from returning
* if `AGENTS.md` is updated, keep the rule specific, enforceable, and grounded in actual repo reality
* if a new feature is added and it creates new trust boundaries or failure modes, `AGENTS.md` review is mandatory before calling the work complete

## 26. Final Rule

Optimize for:

* truth
* explicit boundaries
* stability
* observability
* honest failure modes
* safe local execution
* maintainable provider adapters

Do not trade long-term maintainability for shortcut automation.
Do not trade trust-boundary safety for convenience.
Do not pretend interface automation is more reliable than it really is.

Build V1 as a disciplined local system first.
Scale claims later.

## 27. Architecture Decision Records (ADR)

Major architecture decisions must be written in `docs/adr/` as ADRs.

Required ADR format:
- **Decision**: What was decided
- **Context**: Why this decision was needed
- **Alternatives Considered**: What alternatives were rejected and why
- **Consequences**: Risks and benefits
- **Review Date**: When to re-evaluate (typically 6-12 months)

ADRs document TIMPORARY choices that may change over time.
AGENTS.md holds PERMANENT rules - do not mix these.

## 28. Provider Breakage Protocol

This repo depends on provider web interfaces. Breakage is guaranteed eventually.

When a provider's interface changes:

1. **Detect** - Log the failure, capture method, and selector that broke
2. **Disable** - Mark provider as degraded or disabled explicitly
3. **Fallback** - Log which fallback was used (if any)
4. **Test** - Add regression test if possible
5. **Document** - Update docs/providers.md with breakage notes
6. **Do NOT** - Fake success, silently skip, or hide the failure

Provider adapters must fail honestly when capture is no longer reliable.
Silent degradation without logging is forbidden.

## 29. Selector and Capture Ownership

- DOM selectors live ONLY in provider-owned adapter modules
- Response capture logic lives ONLY in provider-owned modules
- No route handler, UI component, or generic runtime file may hardcode provider DOM behavior
- Any selector change requires provider-specific smoke verification
- If selectors must change, update the provider adapter module first

This rule prevents scattered selector logic that becomes impossible to maintain.

## 30. Local Data Retention

Default behavior (configurable):

**Stored by default:**
- Request logs: Keep last 1000 requests (configurable)
- Settings: Stored in SQLite
- Provider health snapshots: Last N status checks

**NOT stored by default:**
- Full prompts sent to providers
- Full responses from providers
- Raw cookies or auth tokens
- User credentials
- Full file contents sent to providers (unless explicitly requested)

**Retention rules:**
- Request logs rotate automatically
- Users must be able to clear local history
- No persistent storage of sensitive provider sessions

## 31. Release Gate Requirements

Before any release (including V1), verify:

- [ ] Desktop app boots without crash
- [ ] Gateway server starts and /health returns 200
- [ ] MCP server starts and at least one tool responds
- [ ] SQLite initializes without error
- [ ] At least one provider stub returns honest "not implemented"
- [ ] No secrets or session identifiers in logs
- [ ] No unhandled exceptions in startup path

## 32. Compatibility Matrix

| Component | Version | Notes |
|-----------|---------|-------|
| Windows | 10+ | V1 Windows-first |
| Bun | latest | Primary package manager |
| Node | 20.x | Electron/Playwright compatibility |
| Electron | 28+ | Latest stable |
| Playwright | 1.40+ | Browser automation |
| SQLite | 3.x | Via better-sqlite3 |

Document environment assumptions. Random environment bugs waste time and everyone argues from assumptions.

## 33. Current Phase Contract

This repo builds in phases. Phase discipline prevents scope leakage.

### Current Phase: browser_automation

This phase starts real, visible-browser provider automation while preserving the scaffold contracts for providers that are not implemented yet.

**Allowed in browser_automation phase:**

- contracts, schemas, and type definitions
- package structure and imports
- stub provider adapters returning honest "not implemented"
- UI shell with placeholder labels
- local API shell (routes, validation, basic routing)
- MCP server shell (tools registered, returning stub responses)
- SQLite schema and basic initialization
- logging setup and structured output
- unit tests for contracts and schemas
- integration tests for API/MCP parity
- documentation for architecture and security
- provider-owned DOM selectors, readiness checks, prompt submission, and response capture for explicitly implemented providers
- visible, human-login browser automation through app-owned provider profiles
- honest timeout, not-authenticated, not-ready, and UI-changed failure responses

**Forbidden in browser_automation phase:**

- login automation (auto-filling credentials)
- fake provider demos pretending real execution
- token or cookie handling from real providers
- selectors or capture logic outside provider-owned modules
- fake success when a provider page is not ready, logged out, blocked, changed, or timed out

**Phase Exit Criteria:**

- ChatGPT can complete one prompt-response loop through MCP and local API after manual login
- implemented provider selectors live in provider-owned packages such as `packages/provider-chatgpt`, `packages/provider-claude`, `packages/provider-gemini`, and `packages/provider-perplexity`
- unsupported providers still return honest not-implemented responses
- provider breakage returns `PROVIDER_UI_CHANGED`, `PROVIDER_NOT_READY`, or `PROVIDER_TIMEOUT` with logs
- MCP and local API return equivalent normalized responses for the implemented provider

Provider priority note: use Gemini and Perplexity first for no-login smoke paths when the live pages allow it. Their execution scripts must remain in `packages/provider-gemini` and `packages/provider-perplexity`; desktop main may dispatch those scripts but must not own their selectors or capture rules.

## 34. Canonical Owners Map

Every concept must have exactly one owner. Scattered ownership causes drift.

Verified current ownership override:

* `packages/runtime` is the only orchestration layer.
* `apps/gateway` and `apps/mcp` are transport shells over runtime.
* `apps/desktop/src/main` owns BrowserView lifecycle, window attachment, and session bridge only.
* `packages/provider-*` own all provider-specific execution assumptions, selectors, readiness checks, and capture logic.
* `packages/router` is compatibility-only unless a change explicitly rehomes it back into the execution path.
* If a surface cannot truthfully complete a task, it must return an explicit failure response, not a placebo success.

| Concept | Owner Package | Location |
|---------|---------------|----------|
| Provider registry (IDs, aliases, display names, capability flags) | `packages/core` | `src/providers/` |
| Settings schema (ports, host, data dir, log level, max logs, enabled providers, default model, experimental flags) | `packages/storage` | `src/schema.ts` |
| HTTP API transport surface (routes only) | `apps/gateway` | `src/` |
| Runtime orchestration and normalized responses | `packages/runtime` | `src/` |
| MCP tool contract (tool definitions, input schemas) | `apps/mcp` | `src/tools/` |
| Stub response contract (shape, error codes, status) | `packages/core` | `src/providers/` |
| Request log schema (request ID, timestamp, provider, alias, latency, result state) | `packages/storage` | `src/schema.ts` |
| Provider health logic (health check methods, status types) | `packages/provider-base` | `src/` |
| Model alias mapping | `packages/router` | `src/aliases.ts` |
| Error codes and failure taxonomy | `packages/core` | `src/errors.ts` |
| Config defaults | `packages/storage` | `src/defaults.ts` |

All surfaces (desktop, gateway, MCP, tests) must import from these canonical locations. No local redefinition of these concepts.

## 35. Stub and Placeholder Contract

All stubs, placeholders, and planned features must be honest and machine-readable.

### Stub Response Requirements

Every stubbed provider adapter and scaffolded runtime path must return a normalized response conforming to this shape:

```typescript
{
  ok: false,
  providerId: string,
  model: string,
  text: "",
  latencyMs: number,
  loadState: "failed",
  error: {
    code: "PROVIDER_NOT_IMPLEMENTED" | "PROVIDER_NOT_AUTHENTICATED" | "PROVIDER_UNAVAILABLE" | "PROVIDER_NOT_READY" | "DESKTOP_RUNTIME_UNAVAILABLE" | "RUNTIME_ERROR",
    message: string,
    retryable: boolean
  },
  providerName?: string,
  requestId?: string
}
```

### Required Stub Error Codes

| Code | Meaning | Retryable |
|------|---------|-----------|
| `PROVIDER_NOT_IMPLEMENTED` | Real automation not yet built | false |
| `PROVIDER_NOT_AUTHENTICATED` | No valid session (future use) | false |
| `PROVIDER_UNAVAILABLE` | Provider down or inaccessible | true |
| `PROVIDER_SESSION_EXPIRED` | Login expired (future use) | false |
| `PROVIDER_UI_CHANGED` | Selector/capture broke | false |
| `PROVIDER_NOT_READY` | Provider is open but not yet usable | true |
| `DESKTOP_RUNTIME_UNAVAILABLE` | Desktop runtime bridge is offline | true |
| `RUNTIME_ERROR` | Local runtime or transport failure | true |

### Placeholder UI Requirements

- All placeholder controls must show explicit label: `scaffold`, `planned`, `not implemented`
- Status indicators must show: `stubbed`, `not implemented`, `scaffold_only`
- No button or toggle may imply functionality that does not exist
- Stub responses must log that they are stubs

### Desktop Ownership Requirement

- `executeJavaScript` and provider DOM assumptions must not live in desktop main unless the code is in a provider-owned adapter module
- Desktop main may manage BrowserView lifecycle, bounds, visibility, and session bridge state only
- Renderer may manage UI controls and display state only
- MCP and gateway must call the shared runtime orchestration layer rather than inventing their own provider flow
- Provider BrowserView opening must be non-blocking: create/register/mount/layout the view before remote `loadURL` work, and guard duplicate opens while a provider is still loading
- Single-provider layout must follow the focused provider, not the first provider that happened to open
- Dev startup must reuse an already healthy loopback gateway instead of crashing on an occupied canonical port
- Provider URL approval must compare parsed URL origins, never raw string prefixes
- MCP stdio servers must keep protocol output on stdout and send logs to stderr only
- Desktop runtime server startup must handle loopback port conflicts explicitly instead of crashing the app process
- If an MCP or smoke helper needs to wake the desktop runtime, it must launch `bun run dev:desktop` directly as a detached child process and poll `http://127.0.0.1:7870/health`; do not route the bootstrap through nested PowerShell wrappers or treat a hidden launcher as verified until the health check passes
- ChatGPT DOM selectors, prompt insertion logic, and response capture scripts must live in `packages/provider-chatgpt`, not desktop main or transport routes
- Desktop development must load `ELECTRON_RENDERER_URL` when present; never hardcode one Vite port as the only renderer URL
- Provider load state must listen for both `did-finish-load` and `did-stop-loading`; provider pages can stop without the finish event the first implementation expected

### Stub Testing Requirements

- Every stub must have at least one regression test
- Stub response shape must be validated by contract tests
- API and MCP must return equivalent stub responses (parity test)

## 36. Provider Registry Contract

Provider metadata must be defined in exactly one place.

### Registry Location

`packages/core/src/providers/registry.ts`

### Registry Schema

```typescript
export interface ProviderRegistry {
  [providerId: string]: {
    id: string;           // e.g., "chatgpt"
    name: string;         // e.g., "ChatGPT"
    aliases: string[];    // e.g., ["gpt", "openai", "chatgpt"]
    capabilities: {
      streaming: boolean;
      vision: boolean;
      codeExecution: boolean;
    };
    authMethod: "browser" | "api_key";
    status: "stubbed" | "experimental" | "stable";
    healthEndpoint?: string;
  };
}
```

### Registry Rules

- All provider IDs, names, aliases, and capability flags must come from this registry
- Desktop UI, gateway, MCP, router, and tests must import from this registry
- Adding a new provider requires updating this registry
- No hardcoded provider strings outside this file
- Registry must be versioned for contract testing

### Model Alias Mapping

Model aliases map to provider IDs:

```typescript
// In packages/router/src/aliases.ts
export const modelAliasMap: Record<string, string> = {
  "chatgpt": "chatgpt",
  "gpt": "chatgpt",
  "openai": "chatgpt",
  "claude": "claude",
  "sonnet": "claude",
  "gemini": "gemini",
  "perplexity": "perplexity",
  "auto": "auto",  // Router decides
};
```

This alias map must reference provider IDs from the registry.

## 37. Error Code and Failure Taxonomy

All failures must be categorized and coded consistently.

### Failure Categories

| Category | Description |
|----------|-------------|
| `validation` | Invalid input, schema violation |
| `provider_unavailable` | Provider service down |
| `provider_not_implemented` | Feature not built yet |
| `provider_not_authenticated` | No valid session |
| `provider_session_expired` | Login no longer valid |
| `provider_ui_changed` | DOM selectors or capture broke |
| `capture_failed` | Response extraction failed |
| `timeout` | Operation timed out |
| `storage_failure` | SQLite or file operation failed |
| `config_failure` | Invalid configuration |
| `network_failure` | Local network issue |

### Error Code Registry

All error codes defined in `packages/core/src/errors.ts`:

```typescript
export const ErrorCodes = {
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  
  // Provider failures
  PROVIDER_NOT_IMPLEMENTED: "PROVIDER_NOT_IMPLEMENTED",
  PROVIDER_NOT_AUTHENTICATED: "PROVIDER_NOT_AUTHENTICATED",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  PROVIDER_SESSION_EXPIRED: "PROVIDER_SESSION_EXPIRED",
  PROVIDER_UI_CHANGED: "PROVIDER_UI_CHANGED",
  PROVIDER_CAPTURE_FAILED: "PROVIDER_CAPTURE_FAILED",
  PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT",
  
  // Infrastructure
  STORAGE_FAILURE: "STORAGE_FAILURE",
  CONFIG_FAILURE: "CONFIG_FAILURE",
  NETWORK_FAILURE: "NETWORK_FAILURE",
  
  // Routing
  ROUTER_NO_PROVIDERS_AVAILABLE: "ROUTER_NO_PROVIDERS_AVAILABLE",
  ROUTER_INVALID_ALIAS: "ROUTER_INVALID_ALIAS",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

### Health Status Types

Provider health states in `packages/core/src/providers/types.ts`:

```typescript
export type ProviderHealthStatus = 
  | "stubbed"        // Not implemented
  | "not_authenticated"  // Needs login
  | "healthy"       // Working
  | "degraded"      // Partially working
  | "unavailable"   // Down
  | "broken";       // UI changed, capture failed
```

### Logging Requirements

- All errors must include error code
- All errors must include provider name when applicable
- All errors must include request ID for correlation
- Stub responses must log that they are stubs
- Provider failures must log selector or capture method that failed

### UI Error Display

- Show error code to user
- Show human-readable message
- Do not expose internal details (paths, stack traces in production)
- Distinguish retryable vs non-retryable errors
