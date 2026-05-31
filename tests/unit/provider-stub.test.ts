import { chatResponseSchema } from '@tessera-gateway/core';
import { ChatGPTAdapter } from '@tessera-gateway/provider-chatgpt';
import { describe, expect, it } from 'vitest';

describe('provider stubs', () => {
  it('returns an honest scaffold-only response', async () => {
    const adapter = new ChatGPTAdapter();
    const response = await adapter.execute({
      model: 'chatgpt',
      messages: [{ role: 'user', content: 'Say hi' }],
    });
    const health = await adapter.getHealth();

    expect(chatResponseSchema.parse(response).provider).toBe('chatgpt');
    expect(response.choices[0]?.message.content).toContain('not implemented');
    expect(health.status).toBe('stubbed');
  });
});
