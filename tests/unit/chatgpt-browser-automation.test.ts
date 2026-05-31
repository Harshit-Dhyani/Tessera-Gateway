import { ErrorCodes } from '@tessera-gateway/core';
import { createChatGptPromptScript } from '@tessera-gateway/provider-chatgpt';
import { describe, expect, it } from 'vitest';

describe('chatgpt browser automation script', () => {
  it('embeds the prompt as an escaped script value', () => {
    const script = createChatGptPromptScript('Hello "ChatGPT"\nReturn text');

    expect(script).toContain(JSON.stringify('Hello "ChatGPT"\nReturn text'));
    expect(script).toContain('data-testid="prompt-textarea"');
    expect(script).toContain('data-message-author-role="assistant"');
  });

  it('returns honest provider failure codes from the page script', () => {
    const script = createChatGptPromptScript('Say hi', 1000);

    expect(script).toContain(ErrorCodes.PROVIDER_NOT_AUTHENTICATED);
    expect(script).toContain(ErrorCodes.PROVIDER_NOT_READY);
    expect(script).toContain(ErrorCodes.PROVIDER_TIMEOUT);
    expect(script).toContain('captureMethod');
  });
});
