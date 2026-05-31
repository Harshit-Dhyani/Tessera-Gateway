import { spawn } from 'bun';

const args = process.argv.slice(2);
const target = args[0] || 'all';

console.log(`[Dev] Starting ${target}...`);

const processes: ReturnType<typeof spawn>[] = [];

async function startDev() {
  if (target === 'all' || target === 'gateway') {
    console.log('[Dev] Starting gateway...');
    const gateway = spawn({
      cmd: ['bun', 'run', 'dev'],
      cwd: 'apps/gateway',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    processes.push(gateway);
  }

  if (target === 'all' || target === 'mcp') {
    console.log('[Dev] Starting MCP server...');
    const mcp = spawn({
      cmd: ['bun', 'run', 'dev'],
      cwd: 'apps/mcp',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    processes.push(mcp);
  }

  if (target === 'all' || target === 'desktop') {
    console.log('[Dev] Starting desktop app...');
    const desktop = spawn({
      cmd: ['bun', 'run', 'dev'],
      cwd: 'apps/desktop',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    processes.push(desktop);
  }

  console.log('[Dev] Dev servers started. Press Ctrl+C to stop.');

  process.on('SIGINT', () => {
    console.log('[Dev] Stopping dev servers...');
    processes.forEach((p) => p.kill());
    process.exit(0);
  });
}

startDev();
