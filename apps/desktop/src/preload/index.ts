import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('gateway', {
  // App
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Provider Views (embedded browser panes)
  openProviderView: (providerId: string) => ipcRenderer.invoke('providerView:open', providerId),
  closeProviderView: (providerId: string) => ipcRenderer.invoke('providerView:close', providerId),
  focusProviderView: (providerId: string) => ipcRenderer.invoke('providerView:focus', providerId),
  setProviderLayout: (layout: 'single' | 'split' | 'grid') => ipcRenderer.invoke('providerView:setLayout', layout),
  getProviderViewState: () => ipcRenderer.invoke('providerView:getState'),
  resetProviderSession: (providerId: string) => ipcRenderer.invoke('providerView:resetSession', providerId),

  // Browser Shell Navigation
  selectProvider: (providerId: string) => ipcRenderer.invoke('provider:select', providerId),
  navigateProvider: (providerId: string, url: string) => ipcRenderer.invoke('provider:navigate', providerId, url),
  providerBack: (providerId: string) => ipcRenderer.invoke('provider:back', providerId),
  providerForward: (providerId: string) => ipcRenderer.invoke('provider:forward', providerId),
  providerReload: (providerId: string) => ipcRenderer.invoke('provider:reload', providerId),
  openProviderExternal: (providerId: string) => ipcRenderer.invoke('provider:openExternal', providerId),
  providerLogin: (providerId: string) => ipcRenderer.invoke('provider:login', providerId),
  getProviderBrowserStates: () => ipcRenderer.invoke('provider:getBrowserStates'),
  getActiveProviderState: () => ipcRenderer.invoke('provider:getActiveState'),

  // Legacy provider
  getProviderStatuses: () => ipcRenderer.invoke('provider:status'),
  resetSession: (providerId: string) => ipcRenderer.invoke('session:reset', providerId),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: unknown) => ipcRenderer.invoke('settings:update', settings),

  // Gateway/MCP
  getGatewayHealth: () => ipcRenderer.invoke('gateway:health'),
  getMcpHealth: () => ipcRenderer.invoke('mcp:health'),

  // Logs
  getLogs: () => ipcRenderer.invoke('logs:get'),
  clearLogs: () => ipcRenderer.invoke('logs:clear'),

  // Provider Workspace Bounds
  setProviderWorkspaceBounds: (bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('providerWorkspace:setBounds', bounds),
  getProviderWorkspaceBounds: () => ipcRenderer.invoke('providerWorkspace:getBounds'),

  // Provider Screen Ownership
  setActiveScreen: (screenId: string) => ipcRenderer.invoke('providerShell:setActiveScreen', screenId),
});

console.log('[Preload] Gateway API exposed with Browser Shell support');
