import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

const proc = spawn('cmd', ['/c', 'bun run src/index.ts'], {
  cwd: 'apps/mcp',
  stdio: ['pipe', 'pipe', 'pipe'],
});

const rl = createInterface({ input: proc.stdout });
let id = 0;

interface McpResponse {
  id?: number;
  result?: {
    content?: Array<{ text?: string }>;
  };
}

interface ProviderState {
  providerId: string;
  isMounted?: boolean;
  loadState?: string;
  currentUrl?: string;
}

function send(method, params = {}) {
  return new Promise<McpResponse>((resolve, reject) => {
    const requestId = ++id;
    const msg = { jsonrpc: '2.0', id: requestId, method, params };

    const handler = (line: string) => {
      try {
        const response = JSON.parse(line);
        if (response.id === requestId) {
          rl.removeListener('line', handler);
          resolve(response);
        }
      } catch {}
    };

    rl.on('line', handler);
    proc.stdin.write(`${JSON.stringify(msg)}\n`);

    setTimeout(() => {
      rl.removeListener('line', handler);
      reject(new Error('Timeout'));
    }, 10000);
  });
}

async function test() {
  console.log('Testing MCP - check state after open...\n');

  try {
    // 1. Open gemini provider
    const openRes = await send('tools/call', { name: 'open_provider', arguments: { providerId: 'gemini' } });
    console.log('1. open_provider(gemini):');
    const openJson = JSON.parse(openRes.result?.content?.[0]?.text ?? '{}');
    console.log('   isMounted:', openJson.state?.isMounted);
    console.log('   loadState:', openJson.state?.loadState);
    console.log('\n---\n');

    // 2. Get state directly via HTTP
    console.log('2. Fetching /runtime/providers/state directly...');
    const http = await import('node:http');
    const stateRes = await new Promise<ProviderState[]>((resolve, reject) => {
      http
        .get('http://127.0.0.1:7870/runtime/providers/state', (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => resolve(JSON.parse(data)));
        })
        .on('error', reject);
    });
    const geminiState = stateRes.find((s) => s.providerId === 'gemini');
    console.log('   gemini isMounted:', geminiState?.isMounted);
    console.log('   gemini loadState:', geminiState?.loadState);
    console.log('   gemini currentUrl:', geminiState?.currentUrl);
    console.log('\n---\n');

    // 3. Wait longer and check again
    await new Promise((r) => setTimeout(r, 5000));
    const stateRes2 = await new Promise<ProviderState[]>((resolve, reject) => {
      http
        .get('http://127.0.0.1:7870/runtime/providers/state', (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => resolve(JSON.parse(data)));
        })
        .on('error', reject);
    });
    const geminiState2 = stateRes2.find((s) => s.providerId === 'gemini');
    console.log('3. After 5s wait:');
    console.log('   gemini isMounted:', geminiState2?.isMounted);
    console.log('   gemini loadState:', geminiState2?.loadState);

    console.log('\n=== TEST COMPLETE ===');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    proc.kill();
    process.exit(0);
  }
}

test();
