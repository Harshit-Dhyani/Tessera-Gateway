import { type ErrorCode, ErrorCodes } from '@tessera-gateway/core/errors';
import { resolveProviderId as coreResolveProviderId, providerRegistry } from '@tessera-gateway/core/providers/registry';
import type {
  LoadState,
  NormalizedResponse,
  ProviderBrowserState,
  ProviderSummary,
} from '@tessera-gateway/core/providers/types';

export { providerRegistry } from '@tessera-gateway/core/providers/registry';
export { resolveProviderId as coreResolveProviderId } from '@tessera-gateway/core/providers/registry';

export function getProviderRegistry() {
  return providerRegistry;
}

export function resolveProviderId(input: string): string | null {
  return coreResolveProviderId(input);
}

export function isValidProvider(providerId: string): boolean {
  return providerId in providerRegistry;
}

export function getProviderInfo(providerId: string) {
  return providerRegistry[providerId as keyof typeof providerRegistry];
}

function buildEmptyState(providerId: string, errorCode?: ErrorCode): ProviderBrowserState {
  const provider = providerRegistry[providerId];

  return {
    providerId,
    allowedDomain: provider?.browserUrl ?? '',
    currentUrl: '',
    title: '',
    isOpen: false,
    isCreated: false,
    isMounted: false,
    isVisible: false,
    participatesInLayout: false,
    isActive: false,
    isFocused: false,
    loadState: errorCode ? 'failed' : 'idle',
    canGoBack: false,
    canGoForward: false,
    isLoggedIn: false,
    isExecuting: false,
    errorCode,
    lastErrorAt: errorCode ? Date.now() : undefined,
  };
}

export function normalizeProviderState(state: ProviderBrowserState): ProviderBrowserState {
  return { ...state };
}

export function createProviderSummary(state: ProviderBrowserState): ProviderSummary {
  const provider = providerRegistry[state.providerId];
  return {
    providerId: state.providerId,
    displayName: provider?.name ?? state.providerId,
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

export function normalizeSuccessResponse(
  providerId: string,
  model: string,
  text: string,
  latencyMs: number,
  loadState: LoadState = 'ready',
  requestId?: string,
): NormalizedResponse {
  const provider = providerRegistry[providerId];
  return {
    ok: true,
    providerId,
    model,
    text,
    latencyMs,
    loadState,
    error: null,
    providerName: provider?.name ?? providerId,
    requestId,
  };
}

export function normalizeErrorResponse(
  providerId: string,
  model: string,
  code: ErrorCode,
  message: string,
  retryable = false,
  requestId?: string,
): NormalizedResponse {
  const provider = providerRegistry[providerId];
  return {
    ok: false,
    providerId,
    model,
    text: '',
    latencyMs: 0,
    loadState: 'failed',
    error: {
      code,
      message,
      retryable,
    },
    providerName: provider?.name ?? providerId,
    requestId,
  };
}

export function createErrorResponse(
  providerId: string,
  code: ErrorCode,
  message: string,
  retryable = false,
  requestId?: string,
): NormalizedResponse {
  return normalizeErrorResponse(providerId, providerId, code, message, retryable, requestId);
}

export function createUnavailableProviderState(
  providerId: string,
  code: ErrorCode = ErrorCodes.DESKTOP_RUNTIME_UNAVAILABLE,
): ProviderBrowserState {
  return buildEmptyState(providerId, code);
}

export function createUnavailableResponse(
  providerId: string,
  code: ErrorCode,
  message: string,
  requestId?: string,
): NormalizedResponse {
  return createErrorResponse(
    providerId,
    code,
    message,
    code === ErrorCodes.DESKTOP_RUNTIME_UNAVAILABLE || code === ErrorCodes.PROVIDER_EXECUTION_FAILED,
    requestId,
  );
}

export function createStubState(providerId: string): ProviderBrowserState {
  return buildEmptyState(providerId);
}

export function createStubResponse(providerId: string, requestId?: string): NormalizedResponse {
  return createErrorResponse(
    providerId,
    ErrorCodes.PROVIDER_NOT_IMPLEMENTED,
    'Provider automation is scaffold-only in this phase.',
    false,
    requestId,
  );
}
