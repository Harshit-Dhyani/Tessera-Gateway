import { ErrorCodes } from '@tessera-gateway/core';
import { createGeminiPromptScript } from '@tessera-gateway/provider-gemini';
import { describe, expect, it } from 'vitest';

describe('gemini browser automation script', () => {
  it('embeds the prompt as an escaped script value', () => {
    const script = createGeminiPromptScript('Hello "Gemini"\nReturn text');

    expect(script).toContain(JSON.stringify('Hello "Gemini"\nReturn text'));
    expect(script).toContain('rich-textarea div[contenteditable="true"]');
    expect(script).toContain('message-content');
  });

  it('returns honest provider failure codes from the page script', () => {
    const script = createGeminiPromptScript('Say hi', 1000);

    expect(script).toContain(ErrorCodes.PROVIDER_NOT_AUTHENTICATED);
    expect(script).toContain(ErrorCodes.PROVIDER_NOT_READY);
    expect(script).toContain(ErrorCodes.PROVIDER_TIMEOUT);
    expect(script).toContain('captureMethod');
  });
});
