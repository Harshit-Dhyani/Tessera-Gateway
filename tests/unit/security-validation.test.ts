import { validateHost, validatePath, validateUrl } from '@tessera-gateway/security';
import { describe, expect, it } from 'vitest';

describe('security validation', () => {
  it('rejects dangerous or private-network urls', () => {
    expect(validateUrl('javascript:alert(1)')).toBe(false);
    expect(validateUrl('http://192.168.1.10')).toBe(false);
    expect(validateUrl('http://10.0.0.4')).toBe(false);
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://127.0.0.1:3000')).toBe(true);
  });

  it('limits host validation and path traversal', () => {
    expect(validateHost('localhost')).toBe(true);
    expect(validateHost('127.0.0.1:3000')).toBe(true);
    expect(validateHost('10.0.0.4')).toBe(false);
    expect(validatePath('../secrets.txt')).toBe(false);
    expect(validatePath('data/provider.json')).toBe(true);
  });
});
