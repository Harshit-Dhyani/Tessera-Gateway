# Git and GitHub Workflow

This document defines the normal Git and GitHub workflow for Tessera Gateway.

## Branches

`main` is the canonical branch. It should always be buildable.

Use short topic branches for work:

```bash
git switch -c codex/provider-gemini-capture
```

Recommended branch prefixes:

| Prefix | Use |
|--------|-----|
| `codex/` | agent-assisted implementation |
| `feat/` | feature work |
| `fix/` | bug fix |
| `docs/` | documentation-only change |
| `chore/` | maintenance |

## Commit Style

Use concise conventional-style commit messages:

```text
feat(providers): add claude browser automation
fix(providers): sync controlled composer input
docs: document provider login and smoke status
chore(ci): add github validation workflow
```

Keep commits focused. Do not mix unrelated provider behavior, docs, and infrastructure unless they are part of the same verified change.

## Local Verification Before Push

Run the default gate before pushing meaningful changes:

```bash
bun install
bun run lint
bun run typecheck
bun run test
bun run build
```

For provider behavior changes, also run at least one targeted live smoke when possible:

```bash
bun run dev:desktop
bun run mcp:gemini "Say hi in one short sentence."
bun run mcp:perplexity "Say hi in one short sentence."
bun run mcp:claude "Say hi in one short sentence."
```

Live smoke tests require the desktop runtime bridge at:

```text
http://127.0.0.1:7870
```

On Windows, launch the desktop app visibly if hidden launch exits immediately.

## Pull Requests

Every pull request should include:

- summary of behavior changed
- verification commands run
- live provider smoke results when provider behavior changed
- docs updates when behavior, security boundaries, or workflow changed
- known deferred risks

The PR checklist is intentionally strict because provider web automation is fragile and security-sensitive.

## CI

GitHub Actions runs on:

- pushes to `main`
- pull requests into `main`
- manual workflow dispatch

The CI job runs on `windows-latest` because V1 is Windows-first and Electron behavior can differ by platform.

CI steps:

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run test
bun run build
```

CI does not run live provider smoke tests because provider web sessions require interactive BrowserViews and manual login state.

## Provider Breakage Workflow

When a provider breaks:

1. Reproduce with the MCP smoke helper.
2. Record the provider page state without secrets.
3. Return an honest normalized error.
4. Fix selectors/capture only inside the provider-owned package.
5. Add or update focused tests.
6. Update `docs/providers.md` if the observed behavior changed.
7. Commit with a focused `fix(providers): ...` message.

Never fix provider breakage by adding generic selectors in desktop main, by hiding auth gates, or by returning success from page chrome.

## Release Readiness

Before tagging or preparing a release, confirm:

- desktop app boots without crash
- runtime bridge `/health` returns `200`
- MCP server starts and lists tools
- at least one implemented provider returns a real response or an honest auth failure
- no secrets, cookies, tokens, or credentials appear in logs
- docs reflect current provider status

## Dependency Updates

Dependabot is configured for:

- GitHub Actions
- root JavaScript/Bun package metadata

Dependency PRs must still pass the same CI gate before merge.
