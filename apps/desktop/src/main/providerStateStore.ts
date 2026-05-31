import type { ErrorCode, LoadState, ProviderBrowserState } from '@tessera-gateway/core';
import { APPROVED_PROVIDER_URLS } from './providerSessions.js';

type StateChangeCallback = (states: ProviderBrowserState[]) => void;

function createInitialState(providerId: string, allowedDomain: string): ProviderBrowserState {
  return {
    providerId,
    allowedDomain,
    currentUrl: '',
    title: '',
    isOpen: false,
    isCreated: false,
    isMounted: false,
    isVisible: false,
    participatesInLayout: false,
    isActive: false,
    isFocused: false,
    loadState: 'idle',
    canGoBack: false,
    canGoForward: false,
    isLoggedIn: false,
    isExecuting: false,
  };
}

export class ProviderStateStore {
  private states: Map<string, ProviderBrowserState> = new Map();
  private listeners: Set<StateChangeCallback> = new Set();
  private activeProviderId: string | null = null;
  private focusedProviderId: string | null = null;

  constructor() {
    this.initializeStates();
  }

  private initializeStates(): void {
    for (const [id, allowedDomain] of Object.entries(APPROVED_PROVIDER_URLS)) {
      this.states.set(id, createInitialState(id, allowedDomain));
    }
  }

  subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private broadcast(): void {
    const allStates = this.getAllStates();
    this.listeners.forEach((cb) => {
      cb(allStates);
    });
  }

  private ensureState(providerId: string): ProviderBrowserState {
    const existing = this.states.get(providerId);
    if (existing) {
      return existing;
    }

    const created = createInitialState(providerId, APPROVED_PROVIDER_URLS[providerId] ?? '');
    this.states.set(providerId, created);
    return created;
  }

  getState(providerId: string): ProviderBrowserState {
    const state = this.ensureState(providerId);
    return {
      ...state,
      isActive: state.providerId === this.activeProviderId,
      isFocused: state.providerId === this.focusedProviderId,
    };
  }

  getAllStates(): ProviderBrowserState[] {
    return Array.from(this.states.values()).map((state) => ({
      ...state,
      isActive: state.providerId === this.activeProviderId,
      isFocused: state.providerId === this.focusedProviderId,
    }));
  }

  getActiveState(): ProviderBrowserState | null {
    if (!this.activeProviderId) return null;
    const state = this.states.get(this.activeProviderId);
    return state ? { ...state, isActive: true, isFocused: state.providerId === this.focusedProviderId } : null;
  }

  getFocusedState(): ProviderBrowserState | null {
    if (!this.focusedProviderId) return null;
    const state = this.states.get(this.focusedProviderId);
    return state ? { ...state, isActive: state.providerId === this.activeProviderId, isFocused: true } : null;
  }

  setActiveProvider(providerId: string | null): void {
    this.activeProviderId = providerId && this.states.has(providerId) ? providerId : null;
    this.broadcast();
  }

  setFocusedProvider(providerId: string | null): void {
    this.focusedProviderId = providerId && this.states.has(providerId) ? providerId : null;
    this.broadcast();
  }

  setOpen(providerId: string, isOpen: boolean): void {
    const state = this.ensureState(providerId);
    state.isOpen = isOpen;
    if (!isOpen) {
      state.participatesInLayout = false;
    }
    this.broadcast();
  }

  setVisible(providerId: string, isVisible: boolean): void {
    const state = this.ensureState(providerId);
    state.isVisible = isVisible;
    this.broadcast();
  }

  setParticipatesInLayout(providerId: string, participatesInLayout: boolean): void {
    const state = this.ensureState(providerId);
    state.participatesInLayout = participatesInLayout;
    this.broadcast();
  }

  setCreated(providerId: string, isCreated: boolean): void {
    const state = this.ensureState(providerId);
    state.isCreated = isCreated;
    this.broadcast();
  }

  setMounted(providerId: string, isMounted: boolean): void {
    const state = this.ensureState(providerId);
    state.isMounted = isMounted;
    this.broadcast();
  }

  updateNavigationState(providerId: string, updates: Partial<ProviderBrowserState>): void {
    const state = this.ensureState(providerId);
    Object.assign(state, updates);
    this.broadcast();
  }

  updateLoadState(providerId: string, loadState: LoadState): void {
    const state = this.ensureState(providerId);
    state.loadState = loadState;
    this.broadcast();
  }

  updateTitle(providerId: string, title: string): void {
    const state = this.ensureState(providerId);
    state.title = title;
    this.broadcast();
  }

  updateLoginState(providerId: string, isLoggedIn: boolean): void {
    const state = this.ensureState(providerId);
    state.isLoggedIn = isLoggedIn;
    this.broadcast();
  }

  setError(providerId: string, errorCode: ErrorCode): void {
    const state = this.ensureState(providerId);
    state.errorCode = errorCode;
    state.loadState = 'failed';
    state.lastErrorAt = Date.now();
    this.broadcast();
  }

  startExecution(providerId: string): void {
    const state = this.ensureState(providerId);
    state.isExecuting = true;
    state.lastExecutionStartedAt = Date.now();
    state.lastExecutionFinishedAt = undefined;
    state.lastExecutionErrorCode = undefined;
    state.lastExecutionLatencyMs = undefined;
    this.broadcast();
  }

  finishExecution(providerId: string, errorCode?: ErrorCode, latencyMs?: number): void {
    const state = this.ensureState(providerId);
    state.isExecuting = false;
    state.lastExecutionFinishedAt = Date.now();
    state.lastExecutionErrorCode = errorCode;
    state.lastExecutionLatencyMs =
      latencyMs ?? (state.lastExecutionStartedAt ? Date.now() - state.lastExecutionStartedAt : undefined);
    this.broadcast();
  }

  getExecutionState(providerId: string): {
    isExecuting: boolean;
    lastStartedAt?: number;
    lastFinishedAt?: number;
    lastErrorCode?: ErrorCode;
    lastLatencyMs?: number;
  } {
    const state = this.states.get(providerId);
    if (!state) {
      return { isExecuting: false };
    }

    return {
      isExecuting: state.isExecuting,
      lastStartedAt: state.lastExecutionStartedAt,
      lastFinishedAt: state.lastExecutionFinishedAt,
      lastErrorCode: state.lastExecutionErrorCode,
      lastLatencyMs: state.lastExecutionLatencyMs,
    };
  }

  getActiveProviderId(): string | null {
    return this.activeProviderId;
  }

  getFocusedProviderId(): string | null {
    return this.focusedProviderId;
  }

  setAllFocused(focused: boolean): void {
    this.focusedProviderId = focused ? this.activeProviderId : null;
    this.broadcast();
  }
}

let stateStore: ProviderStateStore | null = null;

export function getProviderStateStore(): ProviderStateStore {
  if (!stateStore) {
    stateStore = new ProviderStateStore();
  }
  return stateStore;
}
