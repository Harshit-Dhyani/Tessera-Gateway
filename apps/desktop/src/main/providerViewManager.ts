import { ErrorCodes, type NormalizedResponse } from '@tessera-gateway/core';
import {
  type ChatGptBrowserAutomationResult,
  createChatGptPromptScript,
} from '@tessera-gateway/provider-chatgpt/browserAutomation';
import { BrowserView, type BrowserWindow, type Session, session, shell } from 'electron';
import type { LayoutMode, ProviderLayoutManager } from './providerLayout.js';
import { getProviderIdFromUrl, getUrlForProvider, isApprovedUrl } from './providerSessions.js';
import { type ProviderBrowserState, getProviderStateStore } from './providerStateStore.js';
import {
  getWorkspaceBounds,
  isWorkspaceBoundsSet,
  setWorkspaceBounds,
  subscribeToWorkspaceBounds,
} from './providerWorkspaceBounds.js';
import type { WorkspaceBounds } from './providerWorkspaceBounds.js';

const DEBUG = process.env.NODE_ENV === 'development';

export class ProviderViewManager {
  private views: Map<string, BrowserView> = new Map();
  private openingProviders: Set<string> = new Set();
  private mainWindow: BrowserWindow | null = null;
  private layoutManager: ProviderLayoutManager;
  private stateStore = getProviderStateStore();
  private isProvidersScreenActive = false;

  constructor(layoutManager: ProviderLayoutManager) {
    this.layoutManager = layoutManager;

    subscribeToWorkspaceBounds(() => {
      if (this.isProvidersScreenActive) {
        this.updateViewBoundsFromWorkspace();
      }
    });
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  setProvidersScreenActive(active: boolean): void {
    this.isProvidersScreenActive = active;
    if (DEBUG) console.log(`[ProviderViewManager] Providers screen: ${active ? 'active' : 'inactive'}`);

    if (active) {
      this.restoreProviderViews();
    } else {
      this.detachAllProviderViews();
    }
  }

  async detachAllProviderViews(): Promise<void> {
    if (!this.mainWindow) return;

    const windowIsAlive = !this.mainWindow.isDestroyed();

    for (const view of this.views.values()) {
      try {
        if (windowIsAlive && !view.webContents.isDestroyed()) {
          this.mainWindow.removeBrowserView(view);
        }
      } catch {
        // Teardown can race Electron window destruction during app shutdown.
      }
    }

    for (const providerId of this.views.keys()) {
      this.stateStore.setVisible(providerId, false);
      this.stateStore.setParticipatesInLayout(providerId, false);
    }
    this.stateStore.setActiveProvider(null);
    this.stateStore.setFocusedProvider(null);
    if (DEBUG) console.log('[ProviderViewManager] All views detached from window');
  }

  async restoreProviderViews(): Promise<void> {
    if (!this.mainWindow) return;

    const workspaceBounds = getWorkspaceBounds();
    if (!workspaceBounds || workspaceBounds.width <= 0 || workspaceBounds.height <= 0) {
      if (DEBUG) console.log('[ProviderViewManager] No workspace bounds, cannot restore');
      return;
    }

    const visibleIds = this.layoutManager.getOpenProviders();
    const boundsMap = this.layoutManager.calculateBounds(workspaceBounds.width, workspaceBounds.height);

    for (const providerId of visibleIds) {
      const view = this.views.get(providerId);
      if (view) {
        const paneBounds = boundsMap.get(providerId);
        if (paneBounds) {
          // Round all values to integers (Electron requires integers)
          const finalBounds = {
            x: Math.round(workspaceBounds.x + paneBounds.x),
            y: Math.round(workspaceBounds.y + paneBounds.y),
            width: Math.round(paneBounds.width),
            height: Math.round(paneBounds.height),
          };
          view.setBounds(finalBounds);
          this.mainWindow.addBrowserView(view);
          this.stateStore.setVisible(providerId, true);
          this.stateStore.setParticipatesInLayout(providerId, true);
        }
      }
    }

    if (visibleIds.length > 0) {
      const focusedId = this.stateStore.getFocusedProviderId() ?? visibleIds[0];
      this.stateStore.setActiveProvider(focusedId);
      this.stateStore.setFocusedProvider(focusedId);
    }

    if (DEBUG) console.log('[ProviderViewManager] Views restored to window');
  }

  async openProviderView(providerId: string): Promise<ProviderBrowserState> {
    const url = getUrlForProvider(providerId);
    if (!url) {
      this.stateStore.setError(providerId, ErrorCodes.PROVIDER_NOT_FOUND);
      return this.stateStore.getState(providerId);
    }

    if (this.views.has(providerId) || this.openingProviders.has(providerId)) {
      if (!this.isProvidersScreenActive) {
        this.isProvidersScreenActive = true;
        await this.restoreProviderViews();
      }
      this.stateStore.setActiveProvider(providerId);
      await this.focusProviderView(providerId);
      return this.stateStore.getState(providerId);
    }

    this.stateStore.setActiveProvider(providerId);
    this.stateStore.setOpen(providerId, true);
    this.stateStore.updateNavigationState(providerId, {
      currentUrl: url,
      loadState: 'loading',
      isVisible: true,
      participatesInLayout: true,
      lastNavigationAt: Date.now(),
    });
    this.stateStore.setCreated(providerId, true);

    // Auto-activate providers screen when opening via MCP/API
    if (!this.isProvidersScreenActive) {
      if (DEBUG) console.log(`[ProviderViewManager] Auto-activating providers screen for: ${providerId}`);
      this.isProvidersScreenActive = true;

      // Set default workspace bounds if not set
      if (!isWorkspaceBoundsSet() && this.mainWindow) {
        const winBounds = this.mainWindow.getBounds();
        const defaultBounds = { x: 0, y: 0, width: winBounds.width, height: winBounds.height };
        if (DEBUG) console.log(`[ProviderViewManager] Setting default workspace bounds:`, defaultBounds);
        setWorkspaceBounds(defaultBounds);
      }
    }

    if (DEBUG)
      console.log(
        `[ProviderViewManager] Opening provider: ${providerId}, workspace valid: ${isWorkspaceBoundsSet()}, screen active: ${this.isProvidersScreenActive}`,
      );

    if (!isWorkspaceBoundsSet()) {
      if (DEBUG) console.log(`[ProviderViewManager] Deferring mount until workspace bounds are set: ${providerId}`);
      return this.stateStore.getState(providerId);
    }

    const result = await this.doMountProvider(providerId, url);

    // If providers screen is not active, ensure the view still gets added to the window
    // This is needed for MCP/API access when the UI is not visible
    if (result.isCreated && !this.isProvidersScreenActive && this.mainWindow) {
      const view = this.views.get(providerId);
      if (view) {
        const workspaceBounds = getWorkspaceBounds();
        if (workspaceBounds) {
          const bounds = this.calculateBoundsForProvider(providerId, workspaceBounds);
          if (bounds) {
            view.setBounds(bounds);
            this.mainWindow.addBrowserView(view);
          }
        }
      }
    }

    return result;
  }

  private async doMountProvider(providerId: string, url: string): Promise<ProviderBrowserState> {
    const workspaceBounds = getWorkspaceBounds();

    if (!workspaceBounds || workspaceBounds.width <= 0 || workspaceBounds.height <= 0) {
      if (DEBUG) console.log(`[ProviderViewManager] No valid workspace bounds, deferring: ${providerId}`);
      return this.stateStore.getState(providerId);
    }

    try {
      if (DEBUG) console.log(`[ProviderViewManager] Creating BrowserView for: ${providerId}`);
      this.openingProviders.add(providerId);

      let view: BrowserView;
      try {
        view = new BrowserView({
          webPreferences: {
            partition: `persist:provider-${providerId}`,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        });
      } catch (viewError) {
        if (DEBUG) console.error(`[ProviderViewManager] Failed to create BrowserView: ${viewError}`);
        this.stateStore.setError(providerId, ErrorCodes.PROVIDER_EXECUTION_FAILED);
        return this.stateStore.getState(providerId);
      }

      this.views.set(providerId, view);
      this.stateStore.setMounted(providerId, true);
      this.layoutManager.addProvider(providerId);
      this.autoSetLayoutFromProviderCount();

      const webContents = view.webContents;

      webContents.on('did-start-loading', () => {
        this.stateStore.updateNavigationState(providerId, {
          loadState: 'loading',
          canGoBack: webContents.canGoBack(),
          canGoForward: webContents.canGoForward(),
        });
      });

      webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        if (DEBUG) console.error(`[ProviderViewManager] Failed to load ${providerId}:`, errorCode, errorDescription);
        this.stateStore.setError(providerId, ErrorCodes.PROVIDER_UI_CHANGED);
      });

      webContents.on('did-finish-load', () => {
        this.stateStore.updateNavigationState(providerId, {
          loadState: 'ready',
          canGoBack: webContents.canGoBack(),
          canGoForward: webContents.canGoForward(),
        });
        this.checkLoginState(providerId);
      });

      webContents.on('did-stop-loading', () => {
        this.stateStore.updateNavigationState(providerId, {
          loadState: 'ready',
          canGoBack: webContents.canGoBack(),
          canGoForward: webContents.canGoForward(),
        });
        this.checkLoginState(providerId);
      });

      webContents.on('did-navigate', (_event, url) => {
        this.stateStore.updateNavigationState(providerId, {
          currentUrl: url,
          canGoBack: webContents.canGoBack(),
          canGoForward: webContents.canGoForward(),
          lastNavigationAt: Date.now(),
        });
      });

      webContents.on('page-title-updated', (_event, title) => {
        this.stateStore.updateTitle(providerId, title);
      });

      webContents.on('will-navigate', (_event, url) => {
        if (!isApprovedUrl(url)) {
          if (DEBUG) console.warn(`[ProviderViewManager] Blocked navigation to: ${url}`);
          webContents.stop();
        }
      });

      webContents.setWindowOpenHandler(({ url: handlerUrl }) => {
        if (isApprovedUrl(handlerUrl)) {
          const newProviderId = getProviderIdFromUrl(handlerUrl);
          if (newProviderId && newProviderId !== providerId) {
            this.openProviderView(newProviderId);
          }
        }
        return { action: 'deny' };
      });

      // Always add view to window when screen is active
      if (this.isProvidersScreenActive && this.mainWindow) {
        const paneBounds = this.calculateBoundsForProvider(providerId, workspaceBounds);
        if (paneBounds) {
          view.setBounds(paneBounds);
          this.mainWindow.addBrowserView(view);
          this.stateStore.setVisible(providerId, true);
          this.stateStore.setParticipatesInLayout(providerId, true);
          if (DEBUG) console.log(`[ProviderViewManager] Added view to window: ${providerId}`);
        }
      }

      await this.focusProviderView(providerId);

      if (DEBUG) console.log(`[ProviderViewManager] Mounted provider view immediately: ${providerId}`);

      if (DEBUG) console.log(`[ProviderViewManager] Loading URL in background: ${url}`);
      void webContents
        .loadURL(url)
        .catch((loadError) => {
          if (DEBUG) console.error(`[ProviderViewManager] Failed to load URL: ${loadError}`);
          this.stateStore.setError(providerId, ErrorCodes.PROVIDER_UI_CHANGED);
        })
        .finally(() => {
          this.openingProviders.delete(providerId);
        });
    } catch (error) {
      this.openingProviders.delete(providerId);
      if (DEBUG) console.error(`[ProviderViewManager] Error opening ${providerId}:`, error);
      this.stateStore.setError(providerId, ErrorCodes.RUNTIME_ERROR);
    }

    return this.stateStore.getState(providerId);
  }

  private calculateBoundsForProvider(
    providerId: string,
    workspaceBounds: WorkspaceBounds,
  ): { x: number; y: number; width: number; height: number } | null {
    const boundsMap = this.layoutManager.calculateBounds(workspaceBounds.width, workspaceBounds.height);
    const paneBounds = boundsMap.get(providerId);

    if (!paneBounds) return null;

    // Round all values to integers (Electron requires integers)
    return {
      x: Math.round(workspaceBounds.x + paneBounds.x),
      y: Math.round(workspaceBounds.y + paneBounds.y),
      width: Math.round(paneBounds.width),
      height: Math.round(paneBounds.height),
    };
  }

  private async checkLoginState(providerId: string): Promise<void> {
    try {
      const cookies = await session.fromPartition(`persist:provider-${providerId}`).cookies.get({});
      this.stateStore.updateLoginState(providerId, cookies.length > 0);
    } catch {
      this.stateStore.updateLoginState(providerId, false);
    }
  }

  async closeProviderView(providerId: string): Promise<ProviderBrowserState> {
    if (DEBUG) console.log(`[ProviderViewManager] Closing provider: ${providerId}`);

    const view = this.views.get(providerId);

    if (view) {
      try {
        const windowIsAlive = this.mainWindow && !this.mainWindow.isDestroyed();
        const contentsIsAlive = !view.webContents.isDestroyed();

        if (windowIsAlive && contentsIsAlive) {
          this.mainWindow.removeBrowserView(view);
        }
        if (contentsIsAlive) {
          view.webContents.close();
        }
      } catch (e) {
        if (DEBUG) console.log(`[ProviderViewManager] Error closing view: ${e}`);
      }
      this.views.delete(providerId);
    }
    this.openingProviders.delete(providerId);

    if (this.stateStore.getActiveProviderId() === providerId) {
      this.stateStore.setActiveProvider(null);
    }
    if (this.stateStore.getFocusedProviderId() === providerId) {
      this.stateStore.setFocusedProvider(null);
    }
    this.stateStore.setOpen(providerId, false);
    this.stateStore.setVisible(providerId, false);
    this.stateStore.setMounted(providerId, false);
    this.stateStore.setCreated(providerId, false);
    this.stateStore.updateNavigationState(providerId, {
      participatesInLayout: false,
      isExecuting: false,
    });
    this.stateStore.updateNavigationState(providerId, {
      currentUrl: '',
      canGoBack: false,
      canGoForward: false,
      loadState: 'idle',
    });

    this.layoutManager.removeProvider(providerId);
    this.autoSetLayoutFromProviderCount();

    if (this.isProvidersScreenActive) {
      this.updateViewBoundsFromWorkspace();
    }

    if (DEBUG) console.log(`[ProviderViewManager] Closed provider: ${providerId}`);
    return this.stateStore.getState(providerId);
  }

  async focusProviderView(providerId: string): Promise<void> {
    if (!this.mainWindow || !this.isProvidersScreenActive) return;

    const visibleIds = this.layoutManager.getOpenProviders();
    const currentLayout = this.layoutManager.getLayout();
    const targetProviderId = visibleIds.includes(providerId) ? providerId : visibleIds[0] || providerId;
    const view = this.views.get(targetProviderId);
    if (!view) return;

    if (currentLayout === 'single') {
      this.layoutManager.setPrimaryProvider(targetProviderId);
    }

    // In single mode, hide all other providers off-screen
    // In split/grid mode, keep all visible at their grid positions, just bring focused to front
    if (currentLayout === 'single') {
      for (const [id, v] of this.views) {
        if (id !== targetProviderId) {
          v.setBounds({ x: -9999, y: -9999, width: 1, height: 1 });
          this.stateStore.setVisible(id, false);
          this.stateStore.setParticipatesInLayout(id, false);
        }
      }
    }

    // Always ensure focused provider has correct bounds and is on top
    const workspaceBounds = getWorkspaceBounds();
    if (workspaceBounds) {
      const bounds = this.calculateBoundsForProvider(targetProviderId, workspaceBounds);
      if (bounds) {
        view.setBounds(bounds);
      }
    }

    this.mainWindow.addBrowserView(view);
    this.stateStore.setFocusedProvider(targetProviderId);
    this.stateStore.setActiveProvider(targetProviderId);
    this.stateStore.setVisible(targetProviderId, true);
    this.stateStore.setParticipatesInLayout(targetProviderId, true);

    if (DEBUG) console.log(`[ProviderViewManager] Focused provider: ${targetProviderId}, layout: ${currentLayout}`);
  }

  async selectProvider(providerId: string): Promise<void> {
    if (this.views.has(providerId)) {
      this.stateStore.setActiveProvider(providerId);
      await this.focusProviderView(providerId);
    } else {
      await this.openProviderView(providerId);
    }
  }

  async navigateProvider(providerId: string, url: string): Promise<void> {
    const view = this.views.get(providerId);
    if (view && isApprovedUrl(url)) {
      await view.webContents.loadURL(url);
    }
  }

  async providerBack(providerId: string): Promise<void> {
    const view = this.views.get(providerId);
    if (view && view.webContents.canGoBack()) {
      view.webContents.goBack();
    }
  }

  async providerForward(providerId: string): Promise<void> {
    const view = this.views.get(providerId);
    if (view && view.webContents.canGoForward()) {
      view.webContents.goForward();
    }
  }

  async providerReload(providerId: string): Promise<void> {
    const view = this.views.get(providerId);
    if (view) {
      view.webContents.reload();
    }
  }

  async openProviderExternal(providerId: string): Promise<void> {
    const state = this.stateStore.getState(providerId);
    if (state.currentUrl) {
      await shell.openExternal(state.currentUrl);
    }
  }

  async providerLogin(providerId: string): Promise<void> {
    const loginUrl = getUrlForProvider(providerId);
    if (loginUrl) {
      const baseUrl = loginUrl.replace(/\/$/, '');
      const authUrl = `${baseUrl}/login`;
      await this.navigateProvider(providerId, authUrl);
    }
  }

  setLayout(layout: LayoutMode): void {
    this.layoutManager.setLayout(layout);
    if (this.isProvidersScreenActive) {
      this.updateViewBoundsFromWorkspace();
    }
    if (DEBUG) console.log(`[ProviderViewManager] Set layout to: ${layout}`);
  }

  autoSetLayoutFromProviderCount(): void {
    const count = this.layoutManager.getOpenProviders().length;
    let newLayout: LayoutMode = 'single';
    if (count === 2) newLayout = 'split';
    else if (count >= 3) newLayout = 'grid';

    const currentLayout = this.layoutManager.getLayout();
    if (newLayout !== currentLayout) {
      this.layoutManager.setLayout(newLayout);
      if (this.isProvidersScreenActive) {
        this.updateViewBoundsFromWorkspace();
      }
      if (DEBUG) console.log(`[ProviderViewManager] Auto-set layout to: ${newLayout} (${count} providers)`);
    }
  }

  getAllStates(): ProviderBrowserState[] {
    return this.stateStore.getAllStates();
  }

  getBrowserStates(): ProviderBrowserState[] {
    return this.stateStore.getAllStates();
  }

  getActiveBrowserState(): ProviderBrowserState | null {
    return this.stateStore.getActiveState();
  }

  getFocusedBrowserState(): ProviderBrowserState | null {
    return this.stateStore.getFocusedState();
  }

  isProvidersScreenActiveNow(): boolean {
    return this.isProvidersScreenActive;
  }

  async resetSession(providerId: string): Promise<void> {
    if (this.views.has(providerId)) {
      await this.closeProviderView(providerId);
    }

    const partitionId = `persist:provider-${providerId}`;
    const sess: Session = session.fromPartition(partitionId);

    try {
      await sess.clearStorageData();
    } catch {}

    try {
      const cookies = await sess.cookies.get({});
      for (const cookie of cookies) {
        const cookieUrl = cookie.domain?.startsWith('.')
          ? `https://${cookie.domain.substring(1)}`
          : `https://${cookie.domain}`;
        await sess.cookies.remove(cookieUrl, cookie.name);
      }
    } catch {}

    this.stateStore.updateLoginState(providerId, false);
    if (DEBUG) console.log(`[ProviderViewManager] Reset session for: ${providerId}`);
  }

  updateViewBounds(): void {
    this.updateViewBoundsFromWorkspace();
  }

  handleWindowResize(): void {
    if (this.isProvidersScreenActive && DEBUG) {
      console.log(`[ProviderViewManager] Window resize, workspace valid: ${isWorkspaceBoundsSet()}`);
    }
    if (this.isProvidersScreenActive) {
      this.updateViewBoundsFromWorkspace();
    }
  }

  setWorkspaceBounds(bounds: WorkspaceBounds): void {
    if (DEBUG) console.log(`[ProviderViewManager] setWorkspaceBounds:`, JSON.stringify(bounds));
    setWorkspaceBounds(bounds);

    if (this.isProvidersScreenActive) {
      this.updateViewBoundsFromWorkspace();
      this.mountDeferredProviders();
    }
  }

  private mountDeferredProviders(): void {
    const workspaceBounds = getWorkspaceBounds();
    if (!workspaceBounds || workspaceBounds.width <= 0 || workspaceBounds.height <= 0) {
      return;
    }

    for (const [providerId, view] of this.views) {
      if (!view || this.stateStore.getState(providerId).isMounted) continue;

      if (DEBUG) console.log(`[ProviderViewManager] Mounting deferred provider: ${providerId}`);
      const bounds = this.calculateBoundsForProvider(providerId, workspaceBounds);
      if (bounds && this.mainWindow) {
        view.setBounds(bounds);
        this.mainWindow.addBrowserView(view);
        this.stateStore.setMounted(providerId, true);
      }
    }
  }

  private updateViewBoundsFromWorkspace(): void {
    if (!this.isProvidersScreenActive) return;

    const workspaceBounds = getWorkspaceBounds();

    if (!workspaceBounds || workspaceBounds.width <= 0 || workspaceBounds.height <= 0) {
      if (DEBUG) console.log(`[ProviderViewManager] updateViewBoundsFromWorkspace: no valid workspace bounds`);
      return;
    }

    if (DEBUG) console.log(`[ProviderViewManager] updateViewBoundsFromWorkspace:`, JSON.stringify(workspaceBounds));

    const openIds = this.layoutManager.getOpenProviders();
    const currentLayout = this.layoutManager.getLayout();
    let focusedId = this.stateStore.getFocusedProviderId();

    // If no focused provider, default to first open provider
    if (!focusedId && openIds.length > 0) {
      focusedId = openIds[0];
    }

    if (currentLayout === 'single' && focusedId) {
      this.layoutManager.setPrimaryProvider(focusedId);
    }

    const boundsMap = this.layoutManager.calculateBounds(workspaceBounds.width, workspaceBounds.height);

    for (const providerId of openIds) {
      const view = this.views.get(providerId);
      if (!view) continue;

      const isFocused = providerId === focusedId;

      // In single mode, hide non-focused providers off-screen
      // In split/grid mode, show all providers at their grid positions
      if (currentLayout === 'single' && !isFocused) {
        view.setBounds({ x: -9999, y: -9999, width: 1, height: 1 });
        this.stateStore.setVisible(providerId, false);
        this.stateStore.setParticipatesInLayout(providerId, false);
        if (DEBUG) console.log(`[ProviderViewManager] Hidden off-screen (single mode): ${providerId}`);
      } else {
        const paneBounds = boundsMap.get(providerId);
        if (!paneBounds) continue;

        // Round all bounds to integers (Electron requires integers)
        const finalBounds = {
          x: Math.round(workspaceBounds.x + paneBounds.x),
          y: Math.round(workspaceBounds.y + paneBounds.y),
          width: Math.round(paneBounds.width),
          height: Math.round(paneBounds.height),
        };
        if (DEBUG)
          console.log(`[ProviderViewManager] Setting view bounds for ${providerId}:`, JSON.stringify(finalBounds));
        view.setBounds(finalBounds);
        this.stateStore.setVisible(providerId, true);
        this.stateStore.setParticipatesInLayout(providerId, true);
      }
    }
  }

  async sendPrompt(providerId: string, prompt: string): Promise<NormalizedResponse> {
    const view = this.views.get(providerId);
    if (!view) {
      return {
        ok: false,
        providerId,
        model: providerId,
        text: '',
        latencyMs: 0,
        loadState: 'failed',
        error: {
          code: ErrorCodes.PROVIDER_NOT_FOUND,
          message: 'Provider view not found',
          retryable: false,
        },
      };
    }

    const webContents = view.webContents;

    const state = this.stateStore.getState(providerId);

    if (!state.isOpen || !state.isMounted || webContents.isLoading()) {
      return {
        ok: false,
        providerId,
        model: providerId,
        text: '',
        latencyMs: 0,
        loadState: 'failed',
        error: {
          code: ErrorCodes.PROVIDER_NOT_READY,
          message: 'Provider is not ready to execute prompts',
          retryable: true,
        },
      };
    }

    if (!state.isLoggedIn && providerId !== 'chatgpt') {
      return {
        ok: false,
        providerId,
        model: providerId,
        text: '',
        latencyMs: 0,
        loadState: 'failed',
        error: {
          code: ErrorCodes.PROVIDER_NOT_AUTHENTICATED,
          message: 'Provider session not authenticated',
          retryable: false,
        },
      };
    }

    try {
      this.stateStore.startExecution(providerId);
      const startedAt = Date.now();

      if (providerId !== 'chatgpt') {
        const latencyMs = Date.now() - startedAt;
        this.stateStore.finishExecution(providerId, ErrorCodes.PROVIDER_NOT_IMPLEMENTED, latencyMs);

        return {
          ok: false,
          providerId,
          model: providerId,
          text: '',
          latencyMs,
          loadState: 'failed',
          error: {
            code: ErrorCodes.PROVIDER_NOT_IMPLEMENTED,
            message: 'Provider automation is implemented for ChatGPT first. This provider is not implemented yet.',
            retryable: false,
          },
        };
      }

      if (DEBUG) console.log(`[ProviderViewManager] sendPrompt executing ChatGPT browser automation`);

      const automationResult = (await webContents.executeJavaScript(
        createChatGptPromptScript(prompt),
        true,
      )) as ChatGptBrowserAutomationResult;

      const latencyMs = Date.now() - startedAt;

      if (!automationResult.ok) {
        const errorCode = automationResult.errorCode ?? ErrorCodes.PROVIDER_UI_CHANGED;
        this.stateStore.finishExecution(providerId, errorCode, latencyMs);

        return {
          ok: false,
          providerId,
          model: providerId,
          text: automationResult.text,
          latencyMs,
          loadState: 'failed',
          error: {
            code: errorCode,
            message: automationResult.errorMessage ?? 'ChatGPT browser automation failed.',
            retryable: errorCode === ErrorCodes.PROVIDER_NOT_READY || errorCode === ErrorCodes.PROVIDER_TIMEOUT,
          },
        };
      }

      this.stateStore.finishExecution(providerId, undefined, latencyMs);

      return {
        ok: true,
        providerId,
        model: providerId,
        text: automationResult.text,
        latencyMs,
        loadState: 'ready',
        error: null,
      };
    } catch (e) {
      if (DEBUG) console.error(`[ProviderViewManager] sendPrompt error:`, e);
      this.stateStore.finishExecution(providerId, ErrorCodes.RUNTIME_ERROR, 0);
      return {
        ok: false,
        providerId,
        model: providerId,
        text: '',
        latencyMs: 0,
        loadState: 'failed',
        error: {
          code: ErrorCodes.RUNTIME_ERROR,
          message: e instanceof Error ? e.message : 'Unknown execution failure',
          retryable: true,
        },
      };
    }
  }

  async closeAll(): Promise<void> {
    const providerIds = Array.from(this.views.keys());
    for (const providerId of providerIds) {
      try {
        await this.closeProviderView(providerId);
      } catch (e) {
        if (DEBUG) console.log(`[ProviderViewManager] Error closing ${providerId}: ${e}`);
      }
    }
  }
}

let viewManager: ProviderViewManager | null = null;

export function createProviderViewManager(layoutManager: ProviderLayoutManager): ProviderViewManager {
  return new ProviderViewManager(layoutManager);
}

export function getProviderViewManager(): ProviderViewManager {
  if (!viewManager) {
    throw new Error('ProviderViewManager has not been initialized');
  }
  return viewManager;
}

export function initializeProviderViewManager(layoutManager: ProviderLayoutManager): ProviderViewManager {
  viewManager = createProviderViewManager(layoutManager);
  return viewManager;
}
