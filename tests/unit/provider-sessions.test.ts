import { describe, expect, it } from 'vitest';
import { getProviderIdFromUrl, isApprovedUrl } from '../../apps/desktop/src/main/providerSessions';

describe('provider session URL approval', () => {
  it('allows approved provider origins and known redirects only', () => {
    expect(isApprovedUrl('https://chat.openai.com/')).toBe(true);
    expect(isApprovedUrl('https://chatgpt.com/auth/login')).toBe(true);
    expect(isApprovedUrl('https://claude.ai/new')).toBe(true);
  });

  it('blocks lookalike hosts that only share a string prefix', () => {
    expect(isApprovedUrl('https://chat.openai.com.evil.example/')).toBe(false);
    expect(isApprovedUrl('https://claude.ai.evil.example/')).toBe(false);
    expect(isApprovedUrl('not-a-url')).toBe(false);
  });

  it('maps approved redirect origins back to the owning provider', () => {
    expect(getProviderIdFromUrl('https://chatgpt.com/auth/login')).toBe('chatgpt');
    expect(getProviderIdFromUrl('https://gemini.google.com/app')).toBe('gemini');
    expect(getProviderIdFromUrl('https://gemini.google.com.evil.example/app')).toBeNull();
  });
});
