import { describe, expect, it } from 'vitest';
import {
  appendRuntimeBodyChunk,
  getAllowedRuntimeOrigin,
  parseRuntimeJsonBody,
  RuntimeBodyTooLargeError,
} from '../../apps/desktop/src/main/runtimeHttpGuards';

describe('desktop runtime HTTP guards', () => {
  it('allows only known local UI origins for browser CORS', () => {
    expect(getAllowedRuntimeOrigin(undefined)).toBeNull();
    expect(getAllowedRuntimeOrigin('http://localhost:5173')).toBe('http://localhost:5173');
    expect(getAllowedRuntimeOrigin('http://localhost:5174')).toBe('http://localhost:5174');
    expect(getAllowedRuntimeOrigin('http://127.0.0.1:7860')).toBe('http://127.0.0.1:7860');
    expect(getAllowedRuntimeOrigin('http://localhost:9999')).toBeNull();
    expect(getAllowedRuntimeOrigin('https://example.com')).toBeNull();
  });

  it('bounds runtime request bodies', () => {
    expect(appendRuntimeBodyChunk('hello', ' world', 32)).toBe('hello world');
    expect(() => appendRuntimeBodyChunk('hello', ' world', 8)).toThrow(RuntimeBodyTooLargeError);
  });

  it('parses only object JSON bodies', () => {
    expect(parseRuntimeJsonBody('')).toEqual({});
    expect(parseRuntimeJsonBody('{"providerId":"chatgpt"}')).toEqual({ providerId: 'chatgpt' });
    expect(parseRuntimeJsonBody('["not","object"]')).toEqual({});
  });
});
