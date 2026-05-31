import { ErrorCodes } from '@tessera-gateway/core';
import { createClaudePromptScript } from '@tessera-gateway/provider-claude';
import { describe, expect, it } from 'vitest';

describe('claude browser automation script', () => {
  it('embeds the prompt as an escaped script value', () => {
    const script = createClaudePromptScript('Hello "Claude"\nReturn text');

    expect(script).toContain(JSON.stringify('Hello "Claude"\nReturn text'));
    expect(script).toContain('.ProseMirror[contenteditable="true"]');
    expect(script).toContain('.font-claude-message');
  });

  it('returns honest provider failure codes from the page script', () => {
    const script = createClaudePromptScript('Say hi', 1000);

    expect(script).toContain(ErrorCodes.PROVIDER_NOT_AUTHENTICATED);
    expect(script).toContain(ErrorCodes.PROVIDER_NOT_READY);
    expect(script).toContain(ErrorCodes.PROVIDER_TIMEOUT);
    expect(script).toContain('captureMethod');
  });
});
