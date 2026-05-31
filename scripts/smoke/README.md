# Smoke Helpers

Small manual smoke helpers live here. They assume the relevant local service is
already running.

## Gateway Health

```powershell
.\scripts\smoke\test-gateway.ps1
```

Checks the local HTTP gateway health endpoint at `http://127.0.0.1:7860/health`.

## Chat Completion Compatibility

```powershell
.\scripts\smoke\test-chat.ps1
```

Sends a small compatibility request to `http://127.0.0.1:7860/v1/chat/completions`.

## ChatGPT Provider Smoke

```powershell
bun run scripts/smoke/smoke-chatgpt.ts
```

Checks the desktop runtime, opens ChatGPT, reads provider state, and attempts a
small prompt. Manual provider login may be required.
