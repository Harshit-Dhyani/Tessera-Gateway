import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    alias: {
      '@tessera-gateway/core': resolve(__dirname, '../../packages/core/src'),
      '@tessera-gateway/runtime': resolve(__dirname, '../../packages/runtime/src'),
      '@tessera-gateway/router': resolve(__dirname, '../../packages/router/src'),
      '@tessera-gateway/provider-chatgpt': resolve(__dirname, '../../packages/provider-chatgpt/src'),
      '@tessera-gateway/provider-claude': resolve(__dirname, '../../packages/provider-claude/src'),
      '@tessera-gateway/provider-gemini': resolve(__dirname, '../../packages/provider-gemini/src'),
      '@tessera-gateway/provider-perplexity': resolve(__dirname, '../../packages/provider-perplexity/src'),
      '@tessera-gateway/provider-base': resolve(__dirname, '../../packages/provider-base/src'),
      '@tessera-gateway/observability': resolve(__dirname, '../../packages/observability/src'),
      '@tessera-gateway/security': resolve(__dirname, '../../packages/security/src'),
    },
  },
});
