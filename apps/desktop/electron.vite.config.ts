import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../..');
const coreDist = resolve(repoRoot, 'packages/core/dist');
const providerChatGptSrc = resolve(repoRoot, 'packages/provider-chatgpt/src');
const providerGeminiSrc = resolve(repoRoot, 'packages/provider-gemini/src');
const providerPerplexitySrc = resolve(repoRoot, 'packages/provider-perplexity/src');

const coreAliases = [
  {
    find: /^@tessera-gateway\/core$/,
    replacement: resolve(coreDist, 'index.js'),
  },
  {
    find: /^@tessera-gateway\/core\/providers\/registry$/,
    replacement: resolve(coreDist, 'providers/registry.js'),
  },
  {
    find: /^@tessera-gateway\/core\/providers\/registry\.js$/,
    replacement: resolve(coreDist, 'providers/registry.js'),
  },
  {
    find: /^@tessera-gateway\/provider-chatgpt$/,
    replacement: resolve(providerChatGptSrc, 'index.ts'),
  },
  {
    find: /^@tessera-gateway\/provider-chatgpt\/browserAutomation$/,
    replacement: resolve(providerChatGptSrc, 'browserAutomation.ts'),
  },
  {
    find: /^@tessera-gateway\/provider-gemini$/,
    replacement: resolve(providerGeminiSrc, 'index.ts'),
  },
  {
    find: /^@tessera-gateway\/provider-gemini\/browserAutomation$/,
    replacement: resolve(providerGeminiSrc, 'browserAutomation.ts'),
  },
  {
    find: /^@tessera-gateway\/provider-perplexity$/,
    replacement: resolve(providerPerplexitySrc, 'index.ts'),
  },
  {
    find: /^@tessera-gateway\/provider-perplexity\/browserAutomation$/,
    replacement: resolve(providerPerplexitySrc, 'browserAutomation.ts'),
  },
] as const;

export default defineConfig({
  main: {
    resolve: {
      alias: coreAliases,
    },
    build: {
      outDir: 'out/main',
    },
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          '@tessera-gateway/core',
          '@tessera-gateway/provider-chatgpt',
          '@tessera-gateway/provider-gemini',
          '@tessera-gateway/provider-perplexity',
          '@tessera-gateway/runtime',
          '@tessera-gateway/observability',
          '@tessera-gateway/security',
          '@tessera-gateway/storage',
          '@tessera-gateway/router',
          '@tessera-gateway/session',
        ],
      }),
    ],
  },
  preload: {
    resolve: {
      alias: coreAliases,
    },
    build: {
      outDir: 'out/preload',
    },
    plugins: [
      externalizeDepsPlugin({
        exclude: [
          '@tessera-gateway/core',
          '@tessera-gateway/provider-chatgpt',
          '@tessera-gateway/provider-gemini',
          '@tessera-gateway/provider-perplexity',
          '@tessera-gateway/runtime',
          '@tessera-gateway/observability',
          '@tessera-gateway/security',
          '@tessera-gateway/storage',
          '@tessera-gateway/router',
          '@tessera-gateway/session',
        ],
      }),
    ],
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: coreAliases,
    },
    build: {
      outDir: 'out/renderer',
    },
    plugins: [react()],
  },
});
