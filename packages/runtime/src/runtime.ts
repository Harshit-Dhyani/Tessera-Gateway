import { ErrorCodes } from '@tessera-gateway/core/errors';
import {
  coreResolveProviderId,
  createErrorResponse,
  createStubState,
  createUnavailableProviderState,
  createUnavailableResponse,
  isValidProvider,
  normalizeProviderState,
  normalizeSuccessResponse,
  providerRegistry,
} from './registry.js';
import type {
  CloseProviderResult,
  FocusProviderResult,
  LayoutMode,
  LayoutResult,
  NormalizedResponse,
  OpenProviderResult,
  ParallelResult,
  ProviderBrowserState,
  ProviderSummary,
  ResetSessionResult,
  RuntimeState,
} from './types.js';

const RUNTIME_PORT = 7870;
const RUNTIME_URL = `http://127.0.0.1:${RUNTIME_PORT}`;
const RUNTIME_FETCH_TIMEOUT_MS = 5000;
const RUNTIME_SEND_PROMPT_TIMEOUT_MS = 150000;
const BROWSER_AUTOMATION_WITH_PAGE_LEVEL_AUTH_CHECK = new Set(['chatgpt', 'claude', 'gemini', 'perplexity']);

interface RuntimeHttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown, timeoutMs?: number): Promise<T>;
}

function createHttpClient(): RuntimeHttpClient {
  async function fetchWithTimeout(
    path: string,
    init?: RequestInit,
    timeoutMs = RUNTIME_FETCH_TIMEOUT_MS,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(`${RUNTIME_URL}${path}`, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async get<T>(path: string): Promise<T> {
      const response = await fetchWithTimeout(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<T>;
    },
    async post<T>(path: string, body?: unknown, timeoutMs?: number): Promise<T> {
      const response = await fetchWithTimeout(
        path,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        },
        timeoutMs,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<T>;
    },
  };
}

let client: RuntimeHttpClient | null = null;

function getClient(): RuntimeHttpClient {
  if (!client) {
    client = createHttpClient();
  }
  return client;
}

function createUnavailableProviderSummary(providerId: string): ProviderSummary {
  const provider = providerRegistry[providerId];
  const state = createUnavailableProviderState(providerId);

  return {
    providerId,
    displayName: provider?.name ?? providerId,
    aliases: provider?.aliases ?? [],
    capabilities: provider?.capabilities ?? { streaming: false, vision: false, codeExecution: false },
    status: provider?.status ?? 'stubbed',
    authMethod: provider?.authMethod ?? 'browser',
    isOpen: state.isOpen,
    isVisible: state.isVisible,
    isActive: state.isActive,
    isFocused: state.isFocused,
    isLoggedIn: state.isLoggedIn,
    loadState: state.loadState,
    participatesInLayout: state.participatesInLayout,
  };
}

function createEmptyRuntimeState(desktopAvailable: boolean): RuntimeState {
  return {
    desktopAvailable,
    currentLayout: 'single',
    openProviders: [],
    visibleProviders: [],
    focusedProvider: null,
    activeProvider: null,
    providersScreenActive: false,
  };
}

function resolveRuntimeProviderId(input: string): string | null {
  const direct = coreResolveProviderId(input);
  if (direct) {
    return direct;
  }

  if (input.toLowerCase() === 'auto') {
    return Object.keys(providerRegistry)[0] ?? null;
  }

  return null;
}

export async function checkDesktopAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNTIME_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${RUNTIME_URL}/health`, { method: 'GET', signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listProviders(): Promise<ProviderSummary[]> {
  const desktopAvailable = await checkDesktopAvailable();

  if (!desktopAvailable) {
    return Object.keys(providerRegistry).map(createUnavailableProviderSummary);
  }

  try {
    const states = await getClient().get<ProviderBrowserState[]>('/runtime/providers/state');
    return Object.values(providerRegistry).map((provider) => {
      const state = states.find((entry) => entry.providerId === provider.id);
      if (!state) {
        return {
          providerId: provider.id,
          displayName: provider.name,
          aliases: provider.aliases,
          capabilities: provider.capabilities,
          status: provider.status,
          authMethod: provider.authMethod,
          isOpen: false,
          isVisible: false,
          isActive: false,
          isFocused: false,
          isLoggedIn: false,
          loadState: 'idle',
          participatesInLayout: false,
        };
      }

      return {
        providerId: provider.id,
        displayName: provider.name,
        aliases: provider.aliases,
        capabilities: provider.capabilities,
        status: provider.status,
        authMethod: provider.authMethod,
        isOpen: state.isOpen,
        isVisible: state.isVisible,
        isActive: state.isActive,
        isFocused: state.isFocused,
        isLoggedIn: state.isLoggedIn,
        loadState: state.loadState,
        participatesInLayout: state.participatesInLayout,
      };
    });
  } catch {
    return Object.keys(providerRegistry).map(createUnavailableProviderSummary);
  }
}

export async function getProviderState(providerId: string): Promise<ProviderBrowserState | null> {
  const resolvedId = resolveRuntimeProviderId(providerId) || providerId;

  if (!isValidProvider(resolvedId)) {
    return null;
  }

  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return createUnavailableProviderState(resolvedId);
  }

  try {
    const states = await getClient().get<ProviderBrowserState[]>('/runtime/providers/state');
    return states.find((state) => state.providerId === resolvedId) ?? createStubState(resolvedId);
  } catch {
    return createUnavailableProviderState(resolvedId, ErrorCodes.RUNTIME_ERROR);
  }
}

export async function openProvider(providerId: string): Promise<OpenProviderResult> {
  const resolvedId = resolveRuntimeProviderId(providerId) || providerId;

  if (!isValidProvider(resolvedId)) {
    return { success: false, state: createUnavailableProviderState(resolvedId, ErrorCodes.PROVIDER_NOT_FOUND) };
  }

  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return { success: false, state: createUnavailableProviderState(resolvedId) };
  }

  try {
    const state = await getClient().post<ProviderBrowserState>('/runtime/providers/open', { providerId: resolvedId });
    return { success: true, state: normalizeProviderState(state) };
  } catch (error) {
    return {
      success: false,
      state: createUnavailableProviderState(
        resolvedId,
        error instanceof Error && error.message.includes('HTTP 404')
          ? ErrorCodes.PROVIDER_NOT_FOUND
          : ErrorCodes.RUNTIME_ERROR,
      ),
    };
  }
}

export async function closeProvider(providerId: string): Promise<CloseProviderResult> {
  const resolvedId = resolveRuntimeProviderId(providerId) || providerId;

  if (!isValidProvider(resolvedId)) {
    return { success: false };
  }

  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return { success: false };
  }

  try {
    await getClient().post('/runtime/providers/close', { providerId: resolvedId });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function focusProvider(providerId: string): Promise<FocusProviderResult> {
  const resolvedId = resolveRuntimeProviderId(providerId) || providerId;

  if (!isValidProvider(resolvedId)) {
    return { success: false, state: createUnavailableProviderState(resolvedId, ErrorCodes.PROVIDER_NOT_FOUND) };
  }

  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return { success: false, state: createUnavailableProviderState(resolvedId) };
  }

  try {
    const state = await getClient().post<ProviderBrowserState>('/runtime/providers/focus', { providerId: resolvedId });
    return { success: true, state: normalizeProviderState(state) };
  } catch {
    return { success: false, state: createUnavailableProviderState(resolvedId, ErrorCodes.RUNTIME_ERROR) };
  }
}

export async function setLayout(layout: LayoutMode): Promise<LayoutResult> {
  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return { success: false, layout: 'single', visibleProviders: [] };
  }

  try {
    const result = await getClient().post<{ layout: LayoutMode; visibleProviders: string[] }>('/runtime/layout/set', {
      layout,
    });
    return { success: true, layout: result.layout, visibleProviders: result.visibleProviders };
  } catch {
    return { success: false, layout: 'single', visibleProviders: [] };
  }
}

export async function openParallelProviders(providerIds: string[]): Promise<ParallelResult> {
  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return { layout: 'single', opened: [], focused: '' };
  }

  try {
    const result = await getClient().post<ParallelResult>('/runtime/providers/openParallel', { providerIds });
    return result;
  } catch {
    return { layout: 'single', opened: [], focused: '' };
  }
}

function createRuntimeUnavailableResponse(providerId: string, requestId?: string): NormalizedResponse {
  return createUnavailableResponse(
    providerId,
    ErrorCodes.DESKTOP_RUNTIME_UNAVAILABLE,
    'Desktop runtime is not available',
    requestId,
  );
}

export async function sendPrompt(
  providerId: string,
  prompt: string,
  systemPrompt?: string,
): Promise<NormalizedResponse> {
  void systemPrompt;

  const resolvedId = resolveRuntimeProviderId(providerId) || providerId;

  if (!isValidProvider(resolvedId)) {
    return createErrorResponse(resolvedId, ErrorCodes.PROVIDER_NOT_FOUND, `Unknown provider: ${providerId}`);
  }

  if (!prompt || !prompt.trim()) {
    return createErrorResponse(resolvedId, ErrorCodes.VALIDATION_ERROR, 'Prompt is required');
  }

  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return createRuntimeUnavailableResponse(resolvedId);
  }

  const state = await getProviderState(resolvedId);
  if (!state) {
    return createErrorResponse(resolvedId, ErrorCodes.PROVIDER_NOT_FOUND, 'Provider not found');
  }

  if (!state.isOpen || !state.isMounted) {
    return createErrorResponse(resolvedId, ErrorCodes.PROVIDER_NOT_READY, 'Provider is not open');
  }

  if (state.loadState === 'loading') {
    return createErrorResponse(resolvedId, ErrorCodes.PROVIDER_NOT_READY, 'Provider is still loading');
  }

  if (state.loadState === 'failed') {
    return createErrorResponse(
      resolvedId,
      state.errorCode ?? ErrorCodes.PROVIDER_UI_CHANGED,
      'Provider is not ready to execute prompts',
    );
  }

  if (!state.isLoggedIn && !BROWSER_AUTOMATION_WITH_PAGE_LEVEL_AUTH_CHECK.has(resolvedId)) {
    return createErrorResponse(resolvedId, ErrorCodes.PROVIDER_NOT_AUTHENTICATED, 'Provider session not authenticated');
  }

  try {
    const result = await getClient().post<NormalizedResponse>(
      '/runtime/providers/sendPrompt',
      {
        providerId: resolvedId,
        prompt,
        systemPrompt,
      },
      RUNTIME_SEND_PROMPT_TIMEOUT_MS,
    );

    return result.ok
      ? normalizeSuccessResponse(
          result.providerId,
          result.model,
          result.text,
          result.latencyMs,
          result.loadState,
          result.requestId,
        )
      : result;
  } catch (error) {
    return createErrorResponse(
      resolvedId,
      ErrorCodes.RUNTIME_ERROR,
      error instanceof Error ? error.message : 'Unknown error',
      true,
    );
  }
}

export async function resetProviderSession(providerId: string): Promise<ResetSessionResult> {
  const resolvedId = resolveRuntimeProviderId(providerId) || providerId;

  if (!isValidProvider(resolvedId)) {
    return { success: false };
  }

  const desktopAvailable = await checkDesktopAvailable();
  if (!desktopAvailable) {
    return { success: false };
  }

  try {
    await getClient().post('/runtime/providers/resetSession', { providerId: resolvedId });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getRuntimeState(): Promise<RuntimeState> {
  const desktopAvailable = await checkDesktopAvailable();

  if (!desktopAvailable) {
    return createEmptyRuntimeState(false);
  }

  try {
    const result = await getClient().get<RuntimeState>('/runtime/state');
    return { ...result, desktopAvailable: true };
  } catch {
    return createEmptyRuntimeState(false);
  }
}
