# Project Tree

> Generated: 2026-04-15

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
    │   │   ├── providerSelectors.ts
    │   │   ├── providerSessions.ts
    │   │   ├── providerStateStore.ts
    │   │   ├── providerViewManager.ts
    │   │   └── providerWorkspaceBounds.ts
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
    │   │       ├── preload.d.ts
    │   │       └── providers.d.ts
    │   │   ├── App.tsx
    │   │   ├── index.css
    │   │   ├── index.html
    │   │   └── main.tsx
    ├── electron.vite.config.ts
    ├── postcss.config.js
    ├── tailwind.config.js
    └── tsconfig.tsbuildinfo
├── gateway
    ├── src
    │   └── index.ts
└── mcp
    ├── src
        └── index.ts
    ├── mcp-gemini-test.ts
    ├── mcp-jsonrpc-test.ts
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
    └── tsconfig.tsbuildinfo
├── observability
    ├── src
    │   ├── index.ts
    │   └── logger.ts
    └── tsconfig.tsbuildinfo
├── provider-base
    ├── src
    │   ├── adapter.ts
    │   ├── index.ts
    │   └── types.ts
    └── tsconfig.tsbuildinfo
├── provider-chatgpt
    ├── src
    │   ├── adapter.ts
    │   └── index.ts
    └── tsconfig.tsbuildinfo
├── provider-claude
    ├── src
    │   ├── adapter.ts
    │   └── index.ts
    └── tsconfig.tsbuildinfo
├── provider-gemini
    ├── src
    │   ├── adapter.ts
    │   └── index.ts
    └── tsconfig.tsbuildinfo
├── provider-perplexity
    ├── src
    │   ├── adapter.ts
    │   └── index.ts
    └── tsconfig.tsbuildinfo
├── router
    ├── src
    │   ├── index.ts
    │   └── interfaces.ts
    └── tsconfig.tsbuildinfo
├── runtime
    ├── src
    │   ├── index.ts
    │   ├── registry.ts
    │   ├── runtime.ts
    │   └── types.ts
    └── tsconfig.tsbuildinfo
├── security
    ├── src
    │   ├── index.ts
    │   ├── redaction.ts
    │   └── validation.ts
    └── tsconfig.tsbuildinfo
├── session
    ├── src
    │   ├── index.ts
    │   └── interfaces.ts
    └── tsconfig.tsbuildinfo
└── storage
    ├── src
        ├── index.ts
        └── schema.ts
    └── tsconfig.tsbuildinfo

---
## Root Config
- package.json
- tsconfig.base.json
- bunfig.toml
- AGENTS.md
- README.md

