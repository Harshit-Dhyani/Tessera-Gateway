# Security

This document outlines security considerations, trust boundaries, and data handling for the Tessera Gateway.

## Threat Model Overview

This project operates in a **local, personal-use** context. The threat model reflects that:

| Actor | Risk Level | Notes |
|-------|------------|-------|
| Local user | Low | Same user as app |
| Local processes | Medium | Could inject requests |
| Remote providers | High | External web interfaces |
| Network neighbors | Low | Loopback-only binding |

## Trust Boundaries

### 1. Renderer ↔ Main (Electron)

**Boundary**: IPC bridge with context isolation

**Rules**:
- Context isolation enabled (default)
- Node integration disabled in renderer
- Preload exposes minimal API only
- All IPC channels validated

```typescript
// preload.ts - explicit channel exposure only
contextBridge.exposeInMainWorld('gateway', {
  getProviderStatus: () => ipcRenderer.invoke('provider:status'),
  // No raw ipcRenderer exposure
  // No require/process exposure
});
```

### 2. Gateway ↔ Router ↔ Providers

**Boundary**: Request validation + response normalization

**Rules**:
- Zod validation at transport layer
- No raw cookies/tokens in requests
- Response normalization strips sensitive metadata
- Provider selection logged (not hidden)

### 3. MCP Server ↔ Router

**Boundary**: Tool schema validation

**Rules**:
- All tool inputs validated via Zod
- No arbitrary code execution
- Tools call same router as HTTP API

### 4. Main ↔ Storage

**Boundary**: Path validation + schema enforcement

**Rules**:
- SQLite only, no arbitrary files
- Settings schema-validated
- No path traversal possible (no file paths exposed)

## Sensitive Data Handling

### What This App Handles

| Data Type | Sensitivity | Handling |
|-----------|-------------|----------|
| Provider sessions | High | Browser profile in app-owned dir only |
| Request prompts | Medium | NOT stored by default |
| Provider responses | Medium | NOT stored by default |
| Settings | Low | SQLite |
| Request logs | Low | Last 1000, rotated |

### What Must Never Be Logged

- Raw cookies or auth tokens
- User credentials
- Full file contents sent to providers
- Session identifiers that could be replayed
- Secret/API keys (none in V1)

### Redaction Rules

```typescript
// observability/src/redaction.ts
export function redactSecrets(obj: unknown): unknown {
  const redactPaths = [
    'cookie',
    'authorization',
    'token',
    'secret',
    'key',
    'sessionId',
  ];
  // Recursively redact matching keys
}
```

## Local Mutation Safety

### File System

**Allowed**:
- SQLite database in configured data directory
- Browser profiles in app-owned directories
- Log rotation

**Forbidden**:
- Arbitrary file read/write
- Path traversal attacks
- Reading user's Chrome/Edge profiles

### Network

**Bound**:
- Loopback only (127.0.0.1)
- No binding to 0.0.0.0 without explicit config

**Forbidden**:
- SSRF attempts
- Internal network access
- Remote URL fetching without allowlist

## Input Validation

### Gateway API

- All endpoints validated via Zod schemas
- Invalid input → 400 with clear error
- No SQL injection (parameterized queries via Drizzle)
- No path traversal in file-related params

### MCP Tools

- Tool input schemas defined
- Validation before execution
- No arbitrary tool registration

### Desktop IPC

- Channel allowlist in main process
- Argument type checking
- No arbitrary handler registration

## Security Anti-Patterns (Forbidden)

| Pattern | Why Forbidden |
|---------|---------------|
| `shell: true` | Arbitrary command execution |
| Raw ipcRenderer in renderer | Breaks context isolation |
| Wildcard CORS | Over-exposed to local callers |
| File path in user input | Path traversal risk |
| Raw logs with user content | Secret leakage |
| Export browser profiles | Session theft risk |
| Import external cookies | Credential theft |

## Privacy Considerations

### Data Minimization

- Prompts not stored by default
- Responses not stored by default
- Only request metadata logged (model, latency, provider)
- User can clear all history

### Browser Profiles

- Each provider isolated in own directory
- Directory created in app data folder
- No sharing between providers
- Clear session = wipe directory

### Network Exposure

- Default: loopback only
- No remote access in V1
- No cloud sync in V1

## Security Verification

Run these checks before release:

```bash
# 1. Check for secret leakage in logs
grep -r "token\|secret\|key\|cookie" logs/

# 2. Verify context isolation
# Check webPreferences in BrowserWindow config

# 3. Test IPC channel validation
# Send malformed IPC messages, verify rejection

# 4. Check for hardcoded secrets
grep -r "password\|secret\|key" --include="*.ts" packages/
```

## Incident Response

If a security issue is found:

1. **Contain** - Disable affected feature
2. **Assess** - Determine scope (logs, storage, network)
3. **Fix** - Patch validation, add redaction
4. **Verify** - Run security checks
5. **Document** - Update this file

## Security Contacts

For this V1 project:
- No external security reporting (local-only)
- Issues tracked in repo issues

## Security-Related Files

| File | Purpose |
|------|---------|
| `packages/security/` | Validation and redaction logic |
| `packages/observability/` | Logging with redaction |
| `apps/desktop/src/main/` | IPC handlers |
| `apps/gateway/src/routes/` | Request validation |