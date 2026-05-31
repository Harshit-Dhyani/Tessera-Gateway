## Summary

<!-- What changed and why? -->

## Verification

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run test`
- [ ] `bun run build`

## Tessera Contract Checklist

- [ ] Provider selectors/capture logic live only in provider-owned packages.
- [ ] MCP and local runtime behavior remain aligned.
- [ ] Provider login is manual and visible; no credential/captcha/session bypass was added.
- [ ] Errors are honest and machine-readable; no fake success from placeholders, prompt echoes, or page chrome.
- [ ] Logs do not include cookies, tokens, credentials, or replayable session identifiers.
- [ ] Docs were updated if provider behavior, runtime behavior, trust boundaries, or workflow changed.

## Runtime Notes

<!-- Mention live smoke results, auth gates, provider pages, or known deferred work. -->
