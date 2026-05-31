# Architecture

This document describes the system architecture for the Tessera Gateway.

## System Overview

Current verified V1 shape:

- `packages/runtime` is the canonical orchestration layer.
- `apps/gateway` and `apps/mcp` are thin transport surfaces over runtime.
- `apps/desktop/src/main` owns BrowserView lifecycle, workspace attachment, and session bridge only.
- `packages/provider-*` own provider-specific execution assumptions and remain honest stubs in scaffold-only phase.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User / Tool Client                            │
│                   (HTTP API, MCP Tools, Desktop UI)                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Gateway (Fastify)                               │
│                    /health, /v1/models, /v1/chat                       │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Runtime Orchestration                               │
│            Provider selection, fallback policy, health                 │
└────────┬───────────────┬───────────────┬───────────────┬───────────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  ChatGPT    │  │  Claude     │  │  Gemini     │  │ Perplexity  │
│  Adapter    │  │  Adapter    │  │  Adapter    │  │  Adapter    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │               │               │               │
       ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Playwright Browser Context                           │
│              Persistent Chromium per provider (V2)                     │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Provider Web Interfaces                             │
│                 chat.openai.com, claude.ai, gemini.google.com          │
└─────────────────────────────────────────────────────────────────────────┘
```

In the current scaffold-only phase, provider adapters must not execute real provider DOM automation or fake successful completions.

## Component Responsibilities

### apps/desktop

**Purpose**: Electron desktop shell and control surface

**Responsibilities**:
- Electron main process lifecycle
- BrowserWindow management
- IPC bridge to renderer
- Provider status display
- Settings management UI
- Log viewer
- Session reset controls

**Must NOT own**:
- Routing logic
- Provider adapter execution
- Core normalization logic
- Provider DOM assumptions or `executeJavaScript` capture paths

### apps/gateway

**Purpose**: Local HTTP API server

**Responsibilities**:
- Fastify server with request validation (Zod)
- `/health` - health check endpoint
- `/v1/models` - available models endpoint
- `/v1/chat/completions` - chat completion endpoint
- Structured logging with Pino
- Request ID propagation

**Must NOT own**:
- Duplicate orchestration logic
- Provider-specific automation

### apps/mcp

**Purpose**: Model Context Protocol server

**Responsibilities**:
- MCP SDK server setup
- Tool registration (ping, status, chat)
- Request validation
- Response formatting

**Must use**:
- Shared runtime for tool execution
- Same core contracts as gateway

### packages/core

**Purpose**: Shared types and contracts

**Contents**:
- Zod schemas (ChatRequest, ChatResponse)
- Model aliases (chatgpt, claude, gemini, perplexity, auto)
- Error types (GatewayError, ProviderError)
- Enums and constants

### packages/router

**Purpose**: Compatibility layer for historical routing helpers

**Responsibilities**:
- Alias helpers and compatibility exports only
- Must not become a second orchestration layer

**Canonical orchestration owner**:
- `packages/runtime`

### packages/session

**Purpose**: Browser session abstractions

**Responsibilities** (V1 placeholder):
- Session status interface
- Profile directory management contract
- Login state check interface

**V1**: Stub only - no real session management

### packages/storage

**Purpose**: Local persistence

**Tables**:
- `settings` - App configuration
- `request_logs` - Request history
- `provider_status` - Provider health snapshots
- `app_state` - Runtime state

**Tech**: SQLite via Drizzle ORM

### packages/observability

**Purpose**: Logging and metrics

**Responsibilities**:
- Pino logger configuration
- Request ID middleware
- Structured event logging
- Redaction helpers

### packages/security

**Purpose**: Input validation and safety

**Responsibilities**:
- Path validation for file tools
- URL allowlist checking
- Secret redaction in logs
- Input sanitization

### packages/provider-*

**Purpose**: Provider adapters (4 packages)

**Interface**:
- `execute(request: ChatRequest): Promise<ChatResponse>`
- `getHealth(): Promise<ProviderHealth>`
- `getMetadata(): ProviderMetadata`

**V1 Status**: All return honest scaffold-only responses

## Data Flow

### HTTP Request Flow

1. Client sends POST to `/v1/chat/completions`
2. Gateway validates request (Zod)
3. Gateway calls runtime.sendPrompt()
4. Runtime resolves provider and checks state
5. Runtime calls provider or desktop bridge
6. Adapter or bridge returns normalized response
7. Gateway logs result and returns to client

### MCP Tool Flow

1. Client calls MCP tool (e.g., `gateway_chat`)
2. MCP server validates input
3. MCP server calls shared runtime
4. Runtime executes as above
5. MCP server formats response for tool output

## IPC Architecture (Desktop)

```
┌─────────────────┐     IPC      ┌─────────────────┐
│   Renderer     │ ◄──────────► │     Main        │
│   (React UI)   │   context    │   (Electron)    │
│                │   Bridge     │                 │
│  - Status      │              │  - Window Mgmt  │
│  - Settings   │              │  - IPC Handlers │
│  - Logs        │              │  - App Lifecycle│
└─────────────────┘              └─────────────────┘
```

### Preload Bridge (Minimal Exposure)

```typescript
// Exposed API surface
window.gateway = {
  getProviderStatus: () => ipcRenderer.invoke('provider:status'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  getLogs: (filter) => ipcRenderer.invoke('logs:get', filter),
  resetSession: (provider) => ipcRenderer.invoke('session:reset', provider),
};
```

## Configuration

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 7860 | Gateway API port |
| `MCP_PORT` | 7861 | MCP server port |
| `DATA_DIR` | `./data` | SQLite database location |
| `LOG_LEVEL` | `info` | Pino log level |

### Settings Schema

```typescript
interface Settings {
  gateway: {
    port: number;
    host: string; // default: '127.0.0.1'
  };
  mcp: {
    port: number;
  };
  storage: {
    dataDir: string;
    maxRequestLogs: number; // default: 1000
  };
  providers: {
    enabled: string[]; // provider IDs
    defaultModel: string; // model alias
  };
  logging: {
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    redactSecrets: boolean;
  };
}
```

## Security Boundaries

1. **Renderer → Main**: IPC only, no Node.js exposure
2. **Main → Storage**: Validated paths, no arbitrary filesystem access
3. **Gateway → Providers**: No credential handling in V1
4. **MCP Tools**: Explicit tool registration, no dynamic execution
5. **Logs**: Redaction of secrets, no raw cookies/tokens

## Extension Points

| Area | Extension Point | Notes |
|------|------------------|-------|
| Providers | `packages/provider-*` | Add new provider package |
| MCP Tools | `apps/mcp/src/tools/` | Add new tool file |
| Storage | `packages/storage` | Add new tables/migrations |
| Router | `packages/router` | Add new fallback policies |
| UI | `apps/desktop/src/renderer/` | Add new React components |
