import { spawn } from 'child_process';
import { createInterface } from 'readline';

const mcp = spawn('bun', ['run', 'src/index.ts'], {
  cwd: 'apps/mcp',
  stdio: ['pipe', 'pipe', 'pipe'],
});

let id = 1;
const pending = new Map();

mcp.stdout.setEncoding('utf8');

const rl = createInterface({ input: mcp.stdout });

rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    const resolver = pending.get(msg.id);
    if (resolver) {
      pending.delete(msg.id);
      resolver(msg);
    }
  } catch {}
});

function call(method, params) {
  return new Promise((resolve) => {
    const requestId = id++;
    pending.set(requestId, resolve);
    const msg = { jsonrpc: '2.0', id: requestId, method, params: params || {} };
    mcp.stdin.write(JSON.stringify(msg) + '\n');
  });
}

async function main() {
  console.log('=== MCP Test ===\n');

  try {
    const tools = await call('tools/list');
    console.log('1. Tools:', JSON.stringify(tools, null, 2).slice(0, 200));

    const state = await call('get_runtime_state');
    console.log('\n2. Runtime state:', JSON.stringify(state, null, 2).slice(0, 300));

    const openGemini = await call('tools/call', { name: 'open_provider', arguments: { providerId: 'gemini' } });
    console.log('\n3. Open Gemini:', JSON.stringify(openGemini, null, 2).slice(0, 300));

    const geminiState = await call('tools/call', { name: 'get_provider_state', arguments: { providerId: 'gemini' } });
    console.log('\n4. Gemini state:', JSON.stringify(geminiState, null, 2).slice(0, 300));

    console.log('\n=== Done ===');
  } catch (e) {
    console.error('Error:', e);
  }

  mcp.kill();
  rl.close();
  process.exit(0);
}

setTimeout(() => {
  mcp.kill();
  rl.close();
  process.exit(1);
}, 30000);
main();
