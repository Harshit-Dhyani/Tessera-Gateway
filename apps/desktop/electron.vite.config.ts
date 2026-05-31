import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '../..');
const coreDist = resolve(repoRoot, 'packages/core/dist');

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
