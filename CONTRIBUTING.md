# Contributing to Tessera Gateway

Tessera Gateway is a Windows-first local AI gateway. It controls provider web
interfaces through a local desktop runtime, local HTTP API, and MCP server.

This project is security-sensitive because it manages local provider sessions,
browser profiles, and localhost surfaces. Keep changes honest, observable, and
small enough to verify.

## Local Setup

Use Bun as the primary package manager:

```bash
bun install
```

Start the desktop runtime when working on provider BrowserViews or MCP prompt
execution:

```bash
bun run dev:desktop
```

Start the MCP server in another terminal when testing MCP clients:

```bash
bun run dev:mcp
```

Start the standalone HTTP gateway when testing the local API surface:

```bash
bun run dev:gateway
```

## Branch and Commit Flow

Use short, focused branches. Follow the workflow in
[docs/git-workflow.md](docs/git-workflow.md).

Recommended commit message style:

```text
feat(provider): add provider readiness guard
fix(runtime): return explicit desktop unavailable error
docs(security): document localhost trust boundary
test(mcp): cover API parity for send_prompt
```

## Verification

For meaningful changes, run the smallest relevant checks plus the default gate
before opening a pull request:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Provider behavior changes also need focused runtime verification where possible:

```bash
bun run apps/mcp/mcp-send-prompt-full.ts gemini
bun run apps/mcp/mcp-send-prompt-full.ts perplexity
bun run apps/mcp/mcp-send-prompt-full.ts claude
```

Report any skipped verification clearly in the pull request.

## Provider Automation Rules

Provider web automation is fragile and must fail honestly.

- Do not automate captcha solving.
- Do not import cookies, tokens, or browser sessions from normal user profiles.
- Do not scrape or log credentials.
- Do not add stealth, fingerprint spoofing, or anti-detection bypasses.
- Keep provider-specific selectors and capture logic in `packages/provider-*`.
- Return explicit error codes instead of pretending a provider worked.
- Update `docs/providers.md` when provider behavior, auth state, or breakage changes.

## MCP and API Parity

The MCP server and HTTP API are two surfaces over the same runtime. If a task is
available in both places, it must use the same core implementation unless the
difference is intentional and documented.

Add or update parity tests for important task families.

## Pull Request Checklist

Before requesting review:

- The change is scoped to the correct package or app.
- User-facing behavior is documented.
- Security-sensitive boundaries were considered.
- New errors use the shared error taxonomy.
- Tests were added or updated for confirmed bugs.
- `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build` were run or explicitly deferred.
- Provider session, auth, and selector changes include focused verification notes.

## Documentation

Update documentation in the same batch when a change affects:

- provider behavior
- MCP tool contracts
- local API behavior
- runtime or desktop ownership
- security boundaries
- setup, verification, or release workflow

If a repeated mistake reveals a missing invariant, encode it in docs, tests, or
CI instead of leaving it as tribal knowledge.
