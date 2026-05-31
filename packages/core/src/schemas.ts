import { z } from 'zod';
import { ErrorCodes } from './errors.js';

export const modelAliasSchema = z.enum(['chatgpt', 'claude', 'gemini', 'perplexity', 'auto']);

export type ModelAlias = z.infer<typeof modelAliasSchema>;

export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatRequestSchema = z.object({
  model: modelAliasSchema,
  messages: z.array(chatMessageSchema),
  stream: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatChoiceSchema = z.object({
  message: chatMessageSchema,
  finish_reason: z.string(),
  index: z.number(),
});

export const chatUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});

export const chatResponseSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion'),
  created: z.number(),
  model: modelAliasSchema,
  choices: z.array(chatChoiceSchema),
  usage: chatUsageSchema.optional(),
  provider: z.string().optional(),
  latency_ms: z.number().optional(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const providerErrorSchema = z.object({
  code: z.nativeEnum(ErrorCodes),
  message: z.string(),
  retryable: z.boolean(),
});

export const providerHealthSchema = z.object({
  provider: z.string(),
  status: z.enum(['stubbed', 'not_authenticated', 'healthy', 'degraded', 'unavailable', 'broken']),
  lastChecked: z.number(),
  message: z.string().optional(),
  latencyMs: z.number().optional(),
  error: z.string().optional(),
});

export type ProviderHealthSchema = z.infer<typeof providerHealthSchema>;

export const providerBrowserStateSchema = z.object({
  providerId: z.string(),
  allowedDomain: z.string(),
  currentUrl: z.string(),
  title: z.string(),
  isOpen: z.boolean(),
  isCreated: z.boolean(),
  isMounted: z.boolean(),
  isVisible: z.boolean(),
  participatesInLayout: z.boolean(),
  isActive: z.boolean(),
  isFocused: z.boolean(),
  loadState: z.enum(['idle', 'loading', 'ready', 'failed']),
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  isLoggedIn: z.boolean(),
  isExecuting: z.boolean(),
  errorCode: z.nativeEnum(ErrorCodes).optional(),
  lastNavigationAt: z.number().optional(),
  lastErrorAt: z.number().optional(),
  lastExecutionStartedAt: z.number().optional(),
  lastExecutionFinishedAt: z.number().optional(),
  lastExecutionErrorCode: z.nativeEnum(ErrorCodes).optional(),
  lastExecutionLatencyMs: z.number().optional(),
});

export const providerSummarySchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  aliases: z.array(z.string()),
  capabilities: z.object({
    streaming: z.boolean(),
    vision: z.boolean(),
    codeExecution: z.boolean(),
  }),
  status: z.enum(['stubbed', 'experimental', 'stable']),
  authMethod: z.enum(['browser', 'api_key']),
  isOpen: z.boolean(),
  isVisible: z.boolean(),
  isActive: z.boolean(),
  isFocused: z.boolean(),
  isLoggedIn: z.boolean(),
  loadState: z.enum(['idle', 'loading', 'ready', 'failed']),
  participatesInLayout: z.boolean(),
});

export const runtimeStateSchema = z.object({
  desktopAvailable: z.boolean(),
  currentLayout: z.enum(['single', 'split', 'grid']),
  openProviders: z.array(z.string()),
  visibleProviders: z.array(z.string()),
  focusedProvider: z.string().nullable(),
  activeProvider: z.string().nullable(),
  providersScreenActive: z.boolean(),
});

export const normalizedResponseSchema = z.object({
  ok: z.boolean(),
  providerId: z.string(),
  model: z.string(),
  text: z.string(),
  latencyMs: z.number(),
  loadState: z.enum(['idle', 'loading', 'ready', 'failed']),
  error: providerErrorSchema.nullable(),
  providerName: z.string().optional(),
  requestId: z.string().optional(),
});

export const routerExecuteOptionsSchema = z.object({
  stream: z.boolean().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
});

export type RouterExecuteOptions = z.infer<typeof routerExecuteOptionsSchema>;

export interface GatewayError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ProviderError extends GatewayError {
  provider: string;
  recoverable: boolean;
}
