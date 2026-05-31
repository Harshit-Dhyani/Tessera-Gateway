import type { ErrorCode } from '../errors.js';

export type LoadState = 'idle' | 'loading' | 'ready' | 'failed';
export type LayoutMode = 'single' | 'split' | 'grid';

export type ProviderHealthStatus = 'stubbed' | 'not_authenticated' | 'healthy' | 'degraded' | 'unavailable' | 'broken';

export interface ProviderCapabilities {
  streaming: boolean;
  vision: boolean;
  codeExecution: boolean;
}

export type ProviderInfoStatus = 'stubbed' | 'experimental' | 'stable';
export type ProviderAuthMethod = 'browser' | 'api_key';

export interface ProviderInfo {
  id: string;
  name: string;
  aliases: string[];
  capabilities: ProviderCapabilities;
  authMethod: ProviderAuthMethod;
  status: ProviderInfoStatus;
  browserUrl: string;
  healthEndpoint?: string;
}

export interface ProviderHealth {
  status: ProviderHealthStatus;
  lastChecked: number;
  latencyMs?: number;
  error?: string;
}

export interface ProviderBrowserState {
  providerId: string;
  allowedDomain: string;
  currentUrl: string;
  title: string;
  isOpen: boolean;
  isCreated: boolean;
  isMounted: boolean;
  isVisible: boolean;
  participatesInLayout: boolean;
  isActive: boolean;
  isFocused: boolean;
  loadState: LoadState;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoggedIn: boolean;
  isExecuting: boolean;
  errorCode?: ErrorCode;
  lastNavigationAt?: number;
  lastErrorAt?: number;
  lastExecutionStartedAt?: number;
  lastExecutionFinishedAt?: number;
  lastExecutionErrorCode?: ErrorCode;
  lastExecutionLatencyMs?: number;
}

export interface ProviderSummary {
  providerId: string;
  displayName: string;
  aliases: string[];
  capabilities: ProviderCapabilities;
  status: ProviderInfoStatus;
  authMethod: ProviderAuthMethod;
  isOpen: boolean;
  isVisible: boolean;
  isActive: boolean;
  isFocused: boolean;
  isLoggedIn: boolean;
  loadState: LoadState;
  participatesInLayout: boolean;
}

export interface RuntimeState {
  desktopAvailable: boolean;
  currentLayout: LayoutMode;
  openProviders: string[];
  visibleProviders: string[];
  focusedProvider: string | null;
  activeProvider: string | null;
  providersScreenActive: boolean;
}

export interface LayoutResult {
  success: boolean;
  layout: LayoutMode;
  visibleProviders: string[];
}

export interface ParallelResult {
  layout: LayoutMode;
  opened: string[];
  focused: string;
}

export interface PromptRequest {
  providerId?: string;
  model?: string;
  prompt: string;
  systemPrompt?: string;
}

export interface ProviderError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
}

export interface NormalizedResponse {
  ok: boolean;
  providerId: string;
  model: string;
  text: string;
  latencyMs: number;
  loadState: LoadState;
  error: ProviderError | null;
  providerName?: string;
  requestId?: string;
}

export interface OpenProviderResult {
  success: boolean;
  state: ProviderBrowserState;
}

export interface FocusProviderResult {
  success: boolean;
  state: ProviderBrowserState;
}

export interface CloseProviderResult {
  success: boolean;
}

export interface ResetSessionResult {
  success: boolean;
}

export type ToolResult<T> = T | { error: string; code: ErrorCode; retryable: boolean };

export function createRuntimeError(code: ErrorCode, message: string, retryable = false): ProviderError {
  return { code, message, retryable };
}
