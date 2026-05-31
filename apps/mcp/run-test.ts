import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const proc = spawn('bun', ['run', 'src/index.ts'], {
  cwd: 'apps/mcp',
  stdio: ['pipe', 'pipe', 'pipe'],
});

const rl = createInterface({ input: proc.stdout });

const id = { value: 0 };
const nextId = () => ++id.value;

function send(method, params = {}) {
  return new Promise((resolve) => {
    const requestId = nextId();
    const msg = { jsonrpc: '2.0', id: requestId, method, params };

    const handler = (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id === requestId) {
          rl.removeListener('line', handler);
          resolve(response);
        }
      } catch {}
    };

    rl.on('line', handler);
    proc.stdin.write(JSON.stringify(msg) + '\n');
  });
}

async function test() {
  console.log('Testing MCP tools...\n');

  // Test 1: tools/list
  const toolsRes = await send('tools/list');
  console.log('1. tools/list:');
  console.log(JSON.stringify(toolsRes, null, 2));
  console.log('\n---');

  // Test 2: list_providers
  const listRes = await send('tools/call', { name: 'list_providers', arguments: {} });
  console.log('2. list_providers:');
  console.log(JSON.stringify(listRes, null, 2));
  console.log('\n---');

  // Test 3: get_provider_state
  const stateRes = await send('tools/call', { name: 'get_provider_state', arguments: { providerId: 'chatgpt' } });
  console.log('3. get_provider_state(chatgpt):');
  console.log(JSON.stringify(stateRes, null, 2));
  console.log('\n---');

  // Test 4: open_provider
  const openRes = await send('tools/call', { name: 'open_provider', arguments: { providerId: 'chatgpt' } });
  console.log('4. open_provider(chatgpt):');
  console.log(JSON.stringify(openRes, null, 2));
  console.log('\n---');

  // Test 5: close_provider
  const closeRes = await send('tools/call', { name: 'close_provider', arguments: { providerId: 'chatgpt' } });
  console.log('5. close_provider(chatgpt):');
  console.log(JSON.stringify(closeRes, null, 2));
  console.log('\n---');

  // Test 6: focus_provider
  const focusRes = await send('tools/call', { name: 'focus_provider', arguments: { providerId: 'claude' } });
  console.log('6. focus_provider(claude):');
  console.log(JSON.stringify(focusRes, null, 2));
  console.log('\n---');

  // Test 7: set_layout
  const layoutRes = await send('tools/call', { name: 'set_layout', arguments: { layout: 'split' } });
  console.log('7. set_layout(split):');
  console.log(JSON.stringify(layoutRes, null, 2));

  proc.kill();
  process.exit(0);
}

test().catch((e) => {
  console.error('Test error:', e);
  proc.kill();
  process.exit(1);
});
