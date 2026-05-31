import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const proc = spawn('cmd', ['/c', 'bun run src/index.ts'], {
  cwd: 'apps/mcp',
  stdio: ['pipe', 'pipe', 'pipe'],
});

const rl = createInterface({ input: proc.stdout });
let id = 0;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const requestId = ++id;
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

    setTimeout(() => {
      rl.removeListener('line', handler);
      reject(new Error('Timeout'));
    }, 10000);
  });
}

async function test() {
  console.log('Testing MCP with Gemini...\n');

  try {
    // 1. Open gemini provider
    const openRes = await send('tools/call', { name: 'open_provider', arguments: { providerId: 'gemini' } });
    console.log('1. open_provider(gemini):');
    console.log(JSON.stringify(openRes, null, 2));
    console.log('\n---\n');

    // Wait for page to load
    await new Promise((r) => setTimeout(r, 3000));

    // 2. Get gemini state
    const stateRes = await send('tools/call', { name: 'get_provider_state', arguments: { providerId: 'gemini' } });
    console.log('2. get_provider_state(gemini):');
    console.log(JSON.stringify(stateRes, null, 2));
    console.log('\n---\n');

    // 3. Send prompt to gemini
    const promptRes = await send('tools/call', {
      name: 'send_prompt',
      arguments: { providerId: 'gemini', prompt: 'Hello, just say hi' },
    });
    console.log('3. send_prompt(gemini):');
    console.log(JSON.stringify(promptRes, null, 2));

    console.log('\n=== TEST COMPLETE ===');
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    proc.kill();
    process.exit(0);
  }
}

test();
