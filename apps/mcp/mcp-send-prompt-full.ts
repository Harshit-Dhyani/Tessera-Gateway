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
    }, 150000);
  });
}

async function test() {
  console.log('Testing send_prompt via MCP...\n');

  try {
    const providerId = process.argv[2] || 'perplexity';

    // 1. Open provider
    console.log(`1. Opening ${providerId}...`);
    const openRes = await send('tools/call', { name: 'open_provider', arguments: { providerId } });
    const openJson = JSON.parse(openRes.result.content[0].text);
    console.log('   success:', openJson.success);
    console.log('   isMounted:', openJson.state?.isMounted);
    console.log('   loadState:', openJson.state?.loadState);
    console.log('\n---\n');

    // Wait for load
    await new Promise((r) => setTimeout(r, 5000));

    // 2. Check state
    console.log(`2. Checking ${providerId} state...`);
    const stateRes = await send('tools/call', { name: 'get_provider_state', arguments: { providerId } });
    const stateJson = JSON.parse(stateRes.result.content[0].text);
    console.log('   isMounted:', stateJson.state?.isMounted);
    console.log('   loadState:', stateJson.state?.loadState);
    console.log('   currentUrl:', stateJson.state?.currentUrl);
    console.log('\n---\n');

    // 3. Send prompt if ready
    if (stateJson.state?.isMounted && stateJson.state?.loadState === 'ready') {
      console.log(`3. Sending prompt to ${providerId}...`);
      const promptRes = await send('tools/call', {
        name: 'send_prompt',
        arguments: { providerId, prompt: 'Say hi in one short sentence.' },
      });
      const promptJson = JSON.parse(promptRes.result.content[0].text);
      console.log('   ok:', promptJson.ok);
      if (promptJson.ok) {
        console.log('   response:', promptJson.text?.substring(0, 200));
      } else {
        console.log('   error:', promptJson.error);
      }
    } else {
      console.log('3. Skipping - provider not ready');
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
