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
    }, 15000);
  });
}

async function test() {
  console.log('Testing send_prompt via MCP...\n');

  try {
    // 1. Check gemini state
    const stateRes = await send('tools/call', { name: 'get_provider_state', arguments: { providerId: 'gemini' } });
    const stateJson = JSON.parse(stateRes.result.content[0].text);
    console.log('1. gemini state:');
    console.log('   isMounted:', stateJson.state?.isMounted);
    console.log('   loadState:', stateJson.state?.loadState);
    console.log('   currentUrl:', stateJson.state?.currentUrl);
    console.log('\n---\n');

    // 2. Send prompt to gemini
    console.log('2. Sending prompt to gemini...');
    const promptRes = await send('tools/call', {
      name: 'send_prompt',
      arguments: { providerId: 'gemini', prompt: 'Say hi in one word' },
    });
    console.log('   Result:');
    console.log(promptRes.result.content[0].text);

    console.log('\n=== DONE ===');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    proc.kill();
    process.exit(0);
  }
}

test();
