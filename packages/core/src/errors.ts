export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DESKTOP_RUNTIME_UNAVAILABLE: 'DESKTOP_RUNTIME_UNAVAILABLE',
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  PROVIDER_NOT_READY: 'PROVIDER_NOT_READY',
  PROVIDER_NOT_IMPLEMENTED: 'PROVIDER_NOT_IMPLEMENTED',
  PROVIDER_NOT_AUTHENTICATED: 'PROVIDER_NOT_AUTHENTICATED',
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  PROVIDER_SESSION_EXPIRED: 'PROVIDER_SESSION_EXPIRED',
  PROVIDER_UI_CHANGED: 'PROVIDER_UI_CHANGED',
  PROVIDER_CAPTURE_FAILED: 'PROVIDER_CAPTURE_FAILED',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  PROVIDER_EXECUTION_FAILED: 'PROVIDER_EXECUTION_FAILED',
  ROUTER_NO_PROVIDERS_AVAILABLE: 'ROUTER_NO_PROVIDERS_AVAILABLE',
  ROUTER_INVALID_ALIAS: 'ROUTER_INVALID_ALIAS',
  STORAGE_FAILURE: 'STORAGE_FAILURE',
  CONFIG_FAILURE: 'CONFIG_FAILURE',
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export type FailureCategory =
  | 'validation'
  | 'runtime_unavailable'
  | 'provider_not_found'
  | 'provider_not_ready'
  | 'provider_not_implemented'
  | 'provider_not_authenticated'
  | 'provider_unavailable'
  | 'provider_session_expired'
  | 'provider_ui_changed'
  | 'capture_failed'
  | 'timeout'
  | 'provider_execution_failed'
  | 'storage_failure'
  | 'config_failure'
  | 'network_failure'
  | 'runtime_error';

export interface AppError {
  code: ErrorCode;
  category: FailureCategory;
  message: string;
  provider?: string;
  requestId?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

const CATEGORY_BY_CODE: Record<ErrorCode, FailureCategory> = {
  VALIDATION_ERROR: 'validation',
  DESKTOP_RUNTIME_UNAVAILABLE: 'runtime_unavailable',
  PROVIDER_NOT_FOUND: 'provider_not_found',
  PROVIDER_NOT_READY: 'provider_not_ready',
  PROVIDER_NOT_IMPLEMENTED: 'provider_not_implemented',
  PROVIDER_NOT_AUTHENTICATED: 'provider_not_authenticated',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  PROVIDER_SESSION_EXPIRED: 'provider_session_expired',
  PROVIDER_UI_CHANGED: 'provider_ui_changed',
  PROVIDER_CAPTURE_FAILED: 'capture_failed',
  PROVIDER_TIMEOUT: 'timeout',
  PROVIDER_EXECUTION_FAILED: 'provider_execution_failed',
  ROUTER_NO_PROVIDERS_AVAILABLE: 'provider_unavailable',
  ROUTER_INVALID_ALIAS: 'validation',
  STORAGE_FAILURE: 'storage_failure',
  CONFIG_FAILURE: 'config_failure',
  NETWORK_FAILURE: 'network_failure',
  RUNTIME_ERROR: 'runtime_error',
};

const RETRYABLE_BY_CODE: Record<ErrorCode, boolean> = {
  VALIDATION_ERROR: false,
  DESKTOP_RUNTIME_UNAVAILABLE: true,
  PROVIDER_NOT_FOUND: false,
  PROVIDER_NOT_READY: true,
  PROVIDER_NOT_IMPLEMENTED: false,
  PROVIDER_NOT_AUTHENTICATED: false,
  PROVIDER_UNAVAILABLE: true,
  PROVIDER_SESSION_EXPIRED: false,
  PROVIDER_UI_CHANGED: false,
  PROVIDER_CAPTURE_FAILED: false,
  PROVIDER_TIMEOUT: true,
  PROVIDER_EXECUTION_FAILED: true,
  ROUTER_NO_PROVIDERS_AVAILABLE: false,
  ROUTER_INVALID_ALIAS: false,
  STORAGE_FAILURE: true,
  CONFIG_FAILURE: false,
  NETWORK_FAILURE: true,
  RUNTIME_ERROR: true,
};

export function createError(
  code: ErrorCode,
  message: string,
  options?: Partial<Omit<AppError, 'code' | 'message'>>,
): AppError {
  return {
    code,
    category: CATEGORY_BY_CODE[code] ?? 'runtime_error',
    message,
    retryable: RETRYABLE_BY_CODE[code] ?? false,
    ...options,
  };
}

export function isRetryableErrorCode(code: ErrorCode): boolean {
  return RETRYABLE_BY_CODE[code] ?? false;
}
