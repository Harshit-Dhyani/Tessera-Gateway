# Project Tree

> Generated: 2026-05-31

## apps/
├── desktop
    ├── out
    │   ├── main
    │   │   └── index.js
    │   ├── preload
    │   │   └── index.mjs
    │   └── renderer
    │   │   ├── assets
    │   │       ├── index-BfKlWqC1.css
    │   │       └── index-D13rRk9a.js
    │   │   └── index.html
    ├── src
    │   ├── main
    │   │   ├── index.ts
    │   │   ├── providerLayout.ts
    │   │   ├── providerSessions.ts
    │   │   ├── providerStateStore.ts
    │   │   ├── providerViewManager.ts
    │   │   ├── providerWorkspaceBounds.ts
    │   │   └── runtimeHttpGuards.ts
    │   ├── preload
    │   │   └── index.ts
    │   └── renderer
    │   │   ├── features
    │   │       ├── dashboard
    │   │       │   └── DashboardScreen.tsx
    │   │       ├── logs
    │   │       │   └── LogsScreen.tsx
    │   │       ├── providers
    │   │       │   ├── ProvidersScreen.tsx
    │   │       │   ├── ProviderTabs.tsx
    │   │       │   ├── ProviderToolbar.tsx
    │   │       │   └── ProviderWorkspace.tsx
    │   │       ├── runtime
    │   │       │   └── RuntimeScreen.tsx
    │   │       └── settings
    │   │       │   └── SettingsScreen.tsx
    │   │   ├── hooks
    │   │   ├── lib
    │   │       └── utils.ts
    │   │   ├── store
    │   │       └── useAppStore.ts
    │   │   ├── types
    │   │       ├── ipc.ts
    │   │       └── preload.d.ts
    │   │   ├── App.tsx
    │   │   ├── index.css
    │   │   ├── index.html
    │   │   └── main.tsx
    ├── electron.vite.config.ts
    ├── postcss.config.js
    ├── tailwind.config.js
├── gateway
    ├── src
    │   └── index.ts
└── mcp
    ├── src
        └── index.ts
    ├── mcp-gemini-full-test.ts
    ├── mcp-gemini-test.ts
    ├── mcp-jsonrpc-test.ts
    ├── mcp-send-prompt-full.ts
    ├── mcp-send-prompt-test.ts
    ├── mcp-state-test.ts
    ├── mcp-test.ts
    ├── run-test.ts
    ├── test-all.ts
    ├── test-client.ts
    ├── test-mcp.ts
    ├── test-tools.ts

---
## packages/
├── core
    ├── src
    │   ├── providers
    │   │   ├── registry.ts
    │   │   └── types.ts
    │   ├── enums.ts
    │   ├── errors.ts
    │   ├── index.ts
    │   └── schemas.ts
├── observability
    ├── src
    │   ├── index.ts
    │   └── logger.ts
├── provider-base
    ├── src
    │   ├── adapter.ts
    │   ├── index.ts
    │   └── types.ts
├── provider-chatgpt
    ├── src
    │   ├── adapter.ts
    │   ├── browserAutomation.ts
    │   └── index.ts
├── provider-claude
    ├── src
    │   ├── adapter.ts
    │   ├── browserAutomation.ts
    │   └── index.ts
├── provider-gemini
    ├── src
    │   ├── adapter.ts
    │   ├── browserAutomation.ts
    │   └── index.ts
├── provider-perplexity
    ├── src
    │   ├── adapter.ts
    │   ├── browserAutomation.ts
    │   └── index.ts
├── router
    ├── src
    │   ├── index.ts
    │   └── interfaces.ts
├── runtime
    ├── src
    │   ├── index.ts
    │   ├── registry.ts
    │   ├── runtime.ts
    │   └── types.ts
├── security
    ├── src
    │   ├── index.ts
    │   ├── redaction.ts
    │   └── validation.ts
├── session
    ├── src
    │   ├── index.ts
    │   └── interfaces.ts
└── storage
    ├── src
        ├── index.ts
        └── schema.ts

---
## Root Config
- package.json
- tsconfig.base.json
- bunfig.toml
- AGENTS.md
- README.md

