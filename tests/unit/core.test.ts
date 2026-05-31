import { chatRequestSchema, chatResponseSchema, modelAliasSchema } from '@tessera-gateway/core/schemas.js';
import { describe, expect, it } from 'vitest';

describe('core/schemas', () => {
  describe('modelAliasSchema', () => {
    it('should accept valid model aliases', () => {
      expect(modelAliasSchema.parse('chatgpt')).toBe('chatgpt');
      expect(modelAliasSchema.parse('claude')).toBe('claude');
      expect(modelAliasSchema.parse('gemini')).toBe('gemini');
      expect(modelAliasSchema.parse('perplexity')).toBe('perplexity');
      expect(modelAliasSchema.parse('auto')).toBe('auto');
    });

    it('should reject invalid model aliases', () => {
      expect(() => modelAliasSchema.parse('gpt-4')).toThrow();
      expect(() => modelAliasSchema.parse('invalid')).toThrow();
    });
  });

  describe('chatRequestSchema', () => {
    it('should accept valid chat request', () => {
      const request = {
        model: 'chatgpt',
        messages: [{ role: 'user', content: 'Hello' }],
      };
      expect(chatRequestSchema.parse(request)).toEqual(request);
    });

    it('should accept optional fields', () => {
      const request = {
        model: 'claude',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: true,
        temperature: 0.7,
        max_tokens: 100,
      };
      expect(chatRequestSchema.parse(request)).toEqual(request);
    });

    it('should reject invalid message role', () => {
      const request = {
        model: 'chatgpt',
        messages: [{ role: 'invalid', content: 'Hello' }],
      };
      expect(() => chatRequestSchema.parse(request)).toThrow();
    });

    it('should reject temperature out of range', () => {
      const request = {
        model: 'chatgpt',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 3,
      };
      expect(() => chatRequestSchema.parse(request)).toThrow();
    });
  });

  describe('chatResponseSchema', () => {
    it('should accept valid chat response', () => {
      const response = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'chatgpt',
        choices: [
          {
            message: { role: 'assistant', content: 'Hi there!' },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        provider: 'chatgpt',
        latency_ms: 100,
      };
      expect(chatResponseSchema.parse(response)).toEqual(response);
    });
  });
});
