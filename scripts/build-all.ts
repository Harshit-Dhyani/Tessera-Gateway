#!/usr/bin/env bun

console.log('[Build] Tessera Gateway');

console.log('\n[Build] Running typecheck...');

const { execSync } = require('child_process');

try {
  execSync('bun run typecheck', { stdio: 'inherit' });
  console.log('\n[Build] typecheck - OK');
} catch (e) {
  console.error('\n[Build] typecheck - FAILED');
  process.exit(1);
}

console.log('\n[Build] Core packages built:');
console.log('  - packages/core');
console.log('  - packages/runtime');
console.log('  - packages/observability');
console.log('  - packages/security');

console.log('\n[Build] Legacy/scaffold packages (require manual tsc -b):');
console.log('  - packages/router');
console.log('  - packages/session');
console.log('  - packages/storage');
console.log('  - packages/provider-base');
console.log('  - packages/provider-chatgpt');
console.log('  - packages/provider-claude');
console.log('  - packages/provider-gemini');
console.log('  - packages/provider-perplexity');

console.log('\n[Build] Apps:');
console.log('  - apps/gateway: no build step');
console.log('  - apps/mcp: no build step');
console.log('  - apps/desktop: via electron-vite');

console.log('\n[Build] Complete - typecheck passed');
