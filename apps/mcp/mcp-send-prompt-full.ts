import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const ROOT = process.cwd();
const BUN_EXE = process.execPath;
const DEV_STACK_TIMEOUT_MS = 180000;
let devStackStarted = false;

function startMcpProcess() {
  return spawn(BUN_EXE, ['run', 'src/index.ts'], {
    cwd: 'apps/mcp',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

const proc = startMcpProcess();

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

async function checkHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForDesktopRuntime(timeoutMs = DEV_STACK_TIMEOUT_MS): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await checkHealth('http://127.0.0.1:7870/health')) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function ensureDevStack(): Promise<void> {
  if (await checkHealth('http://127.0.0.1:7870/health')) {
    return;
  }

  if (devStackStarted) {
    return;
  }

  devStackStarted = true;
  const dev = spawn(BUN_EXE, ['run', 'dev:desktop'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true,
  });
  dev.unref();

  const ready = await waitForDesktopRuntime();
  if (!ready) {
    throw new Error(
      'Desktop runtime did not start automatically. Run `bun run dev:desktop` once to inspect the local stack.',
    );
  }
}

async function waitForProviderReady(providerId: string, timeoutMs = 60000) {
  const startedAt = Date.now();
  let lastState = null;

  while (Date.now() - startedAt < timeoutMs) {
    const stateRes = await send('tools/call', { name: 'get_provider_state', arguments: { providerId } });
    const stateJson = JSON.parse(stateRes.result.content[0].text);
    lastState = stateJson.state ?? null;

    if (lastState?.isMounted && lastState?.loadState === 'ready') {
      return lastState;
    }

    if (lastState?.loadState === 'failed') {
      return lastState;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return lastState;
}

async function test() {
  console.log('Testing send_prompt via MCP...\n');

  try {
    await ensureDevStack();

    const providerId = process.argv[2] || 'perplexity';
    const prompt = process.argv.slice(3).join(' ').trim() || 'Say hi in one short sentence.';

    // 1. Open provider
    console.log(`1. Opening ${providerId}...`);
    const openRes = await send('tools/call', { name: 'open_provider', arguments: { providerId } });
    const openJson = JSON.parse(openRes.result.content[0].text);
    console.log('   success:', openJson.success);
    console.log('   isMounted:', openJson.state?.isMounted);
    console.log('   loadState:', openJson.state?.loadState);
    console.log('\n---\n');

    // 2. Wait until the provider browser pane is mounted and ready.
    console.log(`2. Waiting for ${providerId} state...`);
    const state = await waitForProviderReady(providerId);
    console.log('   isMounted:', state?.isMounted);
    console.log('   loadState:', state?.loadState);
    console.log('   currentUrl:', state?.currentUrl);
    if (state?.errorCode) {
      console.log('   errorCode:', state.errorCode);
    }
    console.log('\n---\n');

    // 3. Send prompt if ready
    if (state?.isMounted && state?.loadState === 'ready') {
      console.log(`3. Sending prompt to ${providerId}...`);
      console.log('   prompt:', prompt);
      const promptRes = await send('tools/call', {
        name: 'send_prompt',
        arguments: { providerId, prompt },
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
