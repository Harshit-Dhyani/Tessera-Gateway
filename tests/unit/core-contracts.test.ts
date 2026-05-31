import {
  ErrorCodes,
  isRetryableErrorCode,
  normalizedResponseSchema,
  providerBrowserStateSchema,
  providerRegistry,
} from '@tessera-gateway/core';
import { createStubResponse, createUnavailableProviderState } from '@tessera-gateway/runtime';
import { describe, expect, it } from 'vitest';

describe('core contracts', () => {
  it('keeps the provider registry canonical and browser-backed', () => {
    expect(Object.keys(providerRegistry)).toEqual(['chatgpt', 'claude', 'gemini', 'perplexity']);
    for (const provider of Object.values(providerRegistry)) {
      expect(provider.browserUrl).toMatch(/^https:\/\//);
      expect(provider.status).toBe('stubbed');
    }
  });

  it('normalizes scaffold-only provider state and responses', () => {
    const state = createUnavailableProviderState('chatgpt');
    const response = createStubResponse('chatgpt');

    expect(providerBrowserStateSchema.parse(state).providerId).toBe('chatgpt');
    expect(normalizedResponseSchema.parse(response).error?.code).toBe(ErrorCodes.PROVIDER_NOT_IMPLEMENTED);
    expect(isRetryableErrorCode(ErrorCodes.PROVIDER_NOT_IMPLEMENTED)).toBe(false);
    expect(isRetryableErrorCode(ErrorCodes.DESKTOP_RUNTIME_UNAVAILABLE)).toBe(true);
  });
});
