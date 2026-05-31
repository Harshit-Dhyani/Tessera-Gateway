# Support

Tessera Gateway is an experimental local project. Support is best effort and
focused on the current V1 scope: Windows-first local desktop runtime, local HTTP
API, MCP server, and provider web-interface automation.

## Where to Ask

- Bugs: open a GitHub issue using the bug report template.
- Provider UI breakage: use the provider breakage template.
- Documentation gaps: use the docs update template.
- Security concerns: follow [SECURITY.md](SECURITY.md).

## What to Include

Include enough detail to reproduce the issue without exposing private data:

- command or UI action used
- provider id, if provider-specific
- layout mode, if relevant
- expected behavior
- actual behavior
- normalized error code
- redacted logs
- Windows, Bun, Node, and Electron versions when relevant

Do not include cookies, tokens, credentials, private prompts, provider account
details, or full session logs.

## Supported Help

- local setup and verification
- desktop runtime startup
- MCP client configuration
- provider login state troubleshooting
- provider UI breakage reports
- local API and MCP parity bugs
- documentation fixes

## Not Supported

- captcha bypass
- credential scraping
- importing browser sessions from normal Chrome or Edge profiles
- stealth automation or fingerprint spoofing
- hosted SaaS deployment
- multi-user production operation
- compliance certification

## Before Opening an Issue

Run the smallest relevant checks:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

For MCP provider execution, start the desktop runtime first:

```bash
bun run dev:desktop
```

Then test the relevant provider path with a redacted, harmless prompt.
