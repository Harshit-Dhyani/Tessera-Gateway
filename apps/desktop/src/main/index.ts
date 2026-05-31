import http from 'http';
import { join } from 'path';
import type { NormalizedResponse } from '@tessera-gateway/core';
import { BrowserWindow, app, ipcMain } from 'electron';
import { type LayoutMode, getProviderLayoutManager } from './providerLayout.js';
import { initializeProviderViewManager } from './providerViewManager.js';
import { getWorkspaceBounds, setWorkspaceBounds } from './providerWorkspaceBounds.js';
import {
  RuntimeBodyTooLargeError,
  appendRuntimeBodyChunk,
  getAllowedRuntimeOrigin,
  parseRuntimeJsonBody,
} from './runtimeHttpGuards.js';

const DEBUG = process.env.NODE_ENV === 'development';
const RUNTIME_PORT = 7870;
const MAX_RUNTIME_LOGS = 1000;

let mainWindow: BrowserWindow | null = null;
const layoutManager = getProviderLayoutManager();
const viewManager = initializeProviderViewManager(layoutManager);
const runtimeLogs: Array<{
  id: string;
  timestamp: number;
  provider: string;
  modelAlias: string;
  latencyMs: number;
  result: 'success' | 'error' | 'timeout';
  errorCode?: string;
}> = [];

function appendRuntimeLog(entry: Omit<(typeof runtimeLogs)[number], 'id' | 'timestamp'>): void {
  runtimeLogs.unshift({
    id: `log_${Date.now()}_${runtimeLogs.length}`,
    timestamp: Date.now(),
    ...entry,
  });

  if (runtimeLogs.length > MAX_RUNTIME_LOGS) {
    runtimeLogs.length = MAX_RUNTIME_LOGS;
  }
}

function readProviderId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const providerId = (body as { providerId?: unknown }).providerId;
  return typeof providerId === 'string' && providerId.trim() ? providerId.trim() : null;
}

function readLayout(body: unknown): LayoutMode | null {
  if (!body || typeof body !== 'object') return null;
  const layout = (body as { layout?: unknown }).layout;
  return layout === 'single' || layout === 'split' || layout === 'grid' ? layout : null;
}

// ============ Local HTTP Runtime Server ============

const runtimeServer = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  const allowedOrigin = getAllowedRuntimeOrigin(origin);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  if (origin && !allowedOrigin) {
    res.writeHead(403);
    res.end(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Origin is not allowed' } }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${RUNTIME_PORT}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
      return;
    }

    // Get all provider states
    if (path === '/runtime/providers/state' && method === 'GET') {
      const states = viewManager.getAllStates();
      res.writeHead(200);
      res.end(JSON.stringify(states));
      return;
    }

    // Open provider
    if (path === '/runtime/providers/open' && method === 'POST') {
      const body = await parseBody(req);
      const providerId = readProviderId(body);
      if (!providerId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'providerId is required' }));
        return;
      }
      const state = await viewManager.openProviderView(providerId);
      appendRuntimeLog({
        provider: providerId,
        modelAlias: providerId,
        latencyMs: 0,
        result: state.errorCode ? 'error' : 'success',
        errorCode: state.errorCode,
      });
      res.writeHead(200);
      res.end(JSON.stringify(state));
      return;
    }

    // Close provider
    if (path === '/runtime/providers/close' && method === 'POST') {
      const body = await parseBody(req);
      const providerId = readProviderId(body);
      if (!providerId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'providerId is required' }));
        return;
      }
      await viewManager.closeProviderView(providerId);
      appendRuntimeLog({ provider: providerId, modelAlias: providerId, latencyMs: 0, result: 'success' });
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Focus provider
    if (path === '/runtime/providers/focus' && method === 'POST') {
      const body = await parseBody(req);
      const providerId = readProviderId(body);
      if (!providerId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'providerId is required' }));
        return;
      }
      await viewManager.focusProviderView(providerId);
      const state = viewManager.getAllStates().find((s) => s.providerId === providerId);
      appendRuntimeLog({
        provider: providerId,
        modelAlias: providerId,
        latencyMs: 0,
        result: state?.errorCode ? 'error' : 'success',
        errorCode: state?.errorCode,
      });
      res.writeHead(200);
      res.end(JSON.stringify(state || null));
      return;
    }

    // Send prompt to provider
    if (path === '/runtime/providers/sendPrompt' && method === 'POST') {
      const body = (await parseBody(req)) as { providerId?: string; prompt?: string; systemPrompt?: string };
      const requestId = `req_${Date.now()}`;

      if (!body.providerId || !body.prompt) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'providerId and prompt are required' }));
        return;
      }

      const startTime = Date.now();
      if (DEBUG)
        console.log(
          `[Runtime] ${requestId} sendPrompt start: provider=${body.providerId}, promptLength=${body.prompt.length}`,
        );

      const result = (await viewManager.sendPrompt(body.providerId, body.prompt)) as NormalizedResponse;

      const latencyMs = Date.now() - startTime;
      appendRuntimeLog({
        provider: result.providerId,
        modelAlias: body.providerId,
        latencyMs,
        result: result.ok ? 'success' : 'error',
        errorCode: result.error?.code,
      });
      if (DEBUG)
        console.log(
          `[Runtime] ${requestId} sendPrompt done: ok=${result.ok}, latencyMs=${latencyMs}, errorCode=${result.error?.code || 'none'}`,
        );

      if (!result.ok && DEBUG) {
        console.log(`[Runtime] ${requestId} sendPrompt error: ${result.error?.message}, code=${result.error?.code}`);
      }

      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    // Reset session
    if (path === '/runtime/providers/resetSession' && method === 'POST') {
      const body = await parseBody(req);
      const providerId = readProviderId(body);
      if (!providerId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'providerId is required' }));
        return;
      }
      await viewManager.resetSession(providerId);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Open parallel providers
    if (path === '/runtime/providers/openParallel' && method === 'POST') {
      const body = (await parseBody(req)) as { providerIds?: unknown };
      const providerIds = Array.isArray(body.providerIds)
        ? body.providerIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : [];
      if (providerIds.length === 0) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'providerIds must be a non-empty array' }));
        return;
      }
      const openIds = [...new Set(providerIds)];
      await Promise.all(openIds.map((id) => viewManager.openProviderView(id)));

      const layout = openIds.length === 1 ? 'single' : openIds.length === 2 ? 'split' : 'grid';
      viewManager.setLayout(layout);

      const focused = openIds[openIds.length - 1];
      await viewManager.focusProviderView(focused);
      appendRuntimeLog({ provider: focused, modelAlias: layout, latencyMs: 0, result: 'success' });

      res.writeHead(200);
      res.end(
        JSON.stringify({
          layout,
          opened: openIds,
          focused,
        }),
      );
      return;
    }

    // Set layout
    if (path === '/runtime/layout/set' && method === 'POST') {
      const body = await parseBody(req);
      const layout = readLayout(body);
      if (!layout) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'layout must be single, split, or grid' }));
        return;
      }
      viewManager.setLayout(layout);
      const visibleProviders = viewManager
        .getAllStates()
        .filter((state) => state.isVisible)
        .map((state) => state.providerId);
      appendRuntimeLog({ provider: 'runtime', modelAlias: layout, latencyMs: 0, result: 'success' });
      res.writeHead(200);
      res.end(
        JSON.stringify({
          layout,
          visibleProviders,
        }),
      );
      return;
    }

    // Get runtime state
    if (path === '/runtime/state' && method === 'GET') {
      const states = viewManager.getAllStates();
      const focusedState = viewManager.getFocusedBrowserState();
      const activeState = viewManager.getActiveBrowserState();

      res.writeHead(200);
      res.end(
        JSON.stringify({
          desktopAvailable: true,
          currentLayout: layoutManager.getLayout(),
          openProviders: layoutManager.getOpenProviders(),
          visibleProviders: states.filter((s) => s.isVisible).map((s) => s.providerId),
          focusedProvider: focusedState?.providerId || null,
          activeProvider: activeState?.providerId || null,
          providersScreenActive: viewManager.isProvidersScreenActiveNow(),
        }),
      );
      return;
    }

    if (path === '/runtime/logs' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(runtimeLogs));
      return;
    }

    if (path === '/runtime/logs/clear' && method === 'POST') {
      runtimeLogs.length = 0;
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path }));
  } catch (error) {
    console.error('[Runtime Server] Error:', error);
    if (error instanceof RuntimeBodyTooLargeError) {
      res.writeHead(413);
      res.end(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Request body is too large' } }));
      return;
    }

    res.writeHead(500);
    res.end(JSON.stringify({ error: { code: 'RUNTIME_ERROR', message: 'Runtime bridge request failed' } }));
  }
});

async function parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      try {
        body = appendRuntimeBodyChunk(body, chunk);
      } catch (error) {
        reject(error);
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(parseRuntimeJsonBody(body));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function startRuntimeServer(): void {
  runtimeServer.listen(RUNTIME_PORT, '127.0.0.1', () => {
    console.log(`[Desktop] Runtime server started on http://127.0.0.1:${RUNTIME_PORT}`);
  });
}

function startMcpServer(): void {
  console.log('[Desktop] MCP server loading...');
}

// ============ Main Window ============

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Tessera Gateway',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  viewManager.setMainWindow(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  console.log('[Desktop] Window created with ProviderViewManager');
}

app.whenReady().then(() => {
  createWindow();
  startRuntimeServer();
  startMcpServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await viewManager.closeAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// App handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion() || '0.1.0';
});

// Provider View IPC Handlers
ipcMain.handle('providerView:open', async (_event, providerId: string) => {
  return viewManager.openProviderView(providerId);
});

ipcMain.handle('providerView:close', async (_event, providerId: string) => {
  return viewManager.closeProviderView(providerId);
});

ipcMain.handle('providerView:focus', async (_event, providerId: string) => {
  return viewManager.focusProviderView(providerId);
});

ipcMain.handle('providerView:setLayout', async (_event, layout: LayoutMode) => {
  return viewManager.setLayout(layout);
});

ipcMain.handle('providerView:getState', async () => {
  return viewManager.getAllStates();
});

ipcMain.handle('providerView:resetSession', async (_event, providerId: string) => {
  return viewManager.resetSession(providerId);
});

// Browser Shell Navigation IPC Handlers
ipcMain.handle('provider:select', async (_event, providerId: string) => {
  return viewManager.selectProvider(providerId);
});

ipcMain.handle('provider:navigate', async (_event, providerId: string, url: string) => {
  return viewManager.navigateProvider(providerId, url);
});

ipcMain.handle('provider:back', async (_event, providerId: string) => {
  return viewManager.providerBack(providerId);
});

ipcMain.handle('provider:forward', async (_event, providerId: string) => {
  return viewManager.providerForward(providerId);
});

ipcMain.handle('provider:reload', async (_event, providerId: string) => {
  return viewManager.providerReload(providerId);
});

ipcMain.handle('provider:openExternal', async (_event, providerId: string) => {
  return viewManager.openProviderExternal(providerId);
});

ipcMain.handle('provider:login', async (_event, providerId: string) => {
  return viewManager.providerLogin(providerId);
});

ipcMain.handle('provider:getBrowserStates', async () => {
  return viewManager.getBrowserStates();
});

ipcMain.handle('provider:getActiveState', async () => {
  return viewManager.getActiveBrowserState();
});

// Legacy provider handlers
ipcMain.handle('provider:status', async () => {
  return viewManager.getAllStates();
});

ipcMain.handle('session:reset', async (_event, providerId: string) => {
  console.log('[Desktop] Session reset:', providerId);
  return viewManager.resetSession(providerId);
});

// Settings handlers
ipcMain.handle('settings:get', async () => {
  return {
    gateway: { port: 7860, host: '127.0.0.1' },
    runtime: { port: 7870, host: '127.0.0.1' },
    mcp: { port: 7861 },
    providers: { enabled: [], defaultModel: 'chatgpt' },
    logs: { retention: 1000 },
  };
});

ipcMain.handle('settings:update', async (_event, settings) => {
  console.log('[Desktop] Settings update:', settings);
  return { success: false, error: 'Settings persistence is not implemented yet' };
});

// Gateway/MCP health
ipcMain.handle('gateway:health', async () => {
  try {
    const response = await fetch('http://127.0.0.1:7860/health');
    if (response.ok) {
      return { running: true, port: 7860, host: '127.0.0.1' };
    }
  } catch {
    // Gateway not running
  }
  return { running: false, port: 7860, host: '127.0.0.1', error: 'Gateway not reachable' };
});

ipcMain.handle('mcp:health', async () => {
  return {
    running: false,
    port: 7861,
    host: '127.0.0.1',
    error: 'MCP is a separate stdio tool process and is not tracked as a background service',
  };
});

// Logs handlers
ipcMain.handle('logs:get', async () => {
  return runtimeLogs;
});

ipcMain.handle('logs:clear', async () => {
  runtimeLogs.length = 0;
  return { success: true };
});

// Provider Workspace Bounds IPC Handlers
ipcMain.handle(
  'providerWorkspace:setBounds',
  async (_event, bounds: { x: number; y: number; width: number; height: number }) => {
    setWorkspaceBounds(bounds);
    viewManager.setWorkspaceBounds(bounds);
    return { success: true };
  },
);

ipcMain.handle('providerWorkspace:getBounds', async () => {
  return getWorkspaceBounds();
});

// Provider Screen Ownership IPC Handler
ipcMain.handle('providerShell:setActiveScreen', async (_event, screenId: string) => {
  const isProviders = screenId === 'providers';
  viewManager.setProvidersScreenActive(isProviders);
  return { success: true };
});
