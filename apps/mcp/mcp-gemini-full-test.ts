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
  console.log('Testing MCP with gemini...\n');

  try {
    // Open gemini and wait longer
    const openRes = await send('tools/call', { name: 'open_provider', arguments: { providerId: 'gemini' } });
    console.log('1. open_provider(gemini):', openRes.result?.content?.[0]?.text?.substring(0, 200));
    console.log('\n---\n');

    // Wait 8 seconds for page to load
    console.log('Waiting 8 seconds for page to load...\n');
    await new Promise((r) => setTimeout(r, 8000));

    // Check state
    const stateRes = await send('tools/call', { name: 'get_provider_state', arguments: { providerId: 'gemini' } });
    console.log('2. get_provider_state(gemini):');
    const stateJson = JSON.parse(stateRes.result.content[0].text);
    console.log('   isMounted:', stateJson.state?.isMounted);
    console.log('   loadState:', stateJson.state?.loadState);
    console.log('   currentUrl:', stateJson.state?.currentUrl);
    console.log('\n---\n');

    // Try send_prompt
    if (stateJson.state?.isMounted && stateJson.state?.loadState === 'ready') {
      console.log('3. Attempting send_prompt...');
      const promptRes = await send('tools/call', {
        name: 'send_prompt',
        arguments: { providerId: 'gemini', prompt: 'Say hi' },
      });
      console.log('   Result:', promptRes.result?.content?.[0]?.text?.substring(0, 300));
    } else {
      console.log('3. Skipping send_prompt - provider not ready');
      console.log('   isMounted:', stateJson.state?.isMounted);
      console.log('   loadState:', stateJson.state?.loadState);
    }

    console.log('\n=== DONE ===');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    proc.kill();
    process.exit(0);
  }
}

test();
