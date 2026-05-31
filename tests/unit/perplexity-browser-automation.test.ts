import { ErrorCodes } from '@tessera-gateway/core';
import { createPerplexityPromptScript } from '@tessera-gateway/provider-perplexity';
import { describe, expect, it } from 'vitest';

describe('perplexity browser automation script', () => {
  it('embeds the prompt as an escaped script value', () => {
    const script = createPerplexityPromptScript('Hello "Perplexity"\nReturn text');

    expect(script).toContain(JSON.stringify('Hello "Perplexity"\nReturn text'));
    expect(script).toContain('textarea[placeholder*="Ask"]');
    expect(script).toContain('[data-testid*="answer"]');
  });

  it('returns honest provider failure codes from the page script', () => {
    const script = createPerplexityPromptScript('Say hi', 1000);

    expect(script).toContain(ErrorCodes.PROVIDER_NOT_AUTHENTICATED);
    expect(script).toContain(ErrorCodes.PROVIDER_NOT_READY);
    expect(script).toContain(ErrorCodes.PROVIDER_TIMEOUT);
    expect(script).toContain('captureMethod');
  });
});
