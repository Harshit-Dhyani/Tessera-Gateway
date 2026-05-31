import { describe, expect, it } from 'vitest';
import { ProviderLayoutManager } from '../../apps/desktop/src/main/providerLayout';

describe('provider layout manager', () => {
  it('gives single mode a single full-workspace slot', () => {
    const layout = new ProviderLayoutManager();
    layout.addProvider('chatgpt');
    layout.addProvider('claude');
    layout.setLayout('single');

    const bounds = layout.calculateBounds(1200, 800);

    expect(bounds.size).toBe(1);
    expect(bounds.get('chatgpt')).toMatchObject({
      x: 8,
      y: 8,
      width: 1184,
      height: 784,
    });
    expect(bounds.has('claude')).toBe(false);
  });

  it('splits two providers across the workspace', () => {
    const layout = new ProviderLayoutManager();
    layout.addProvider('chatgpt');
    layout.addProvider('claude');
    layout.setLayout('split');

    const bounds = layout.calculateBounds(1200, 800);

    expect(bounds.size).toBe(2);
    expect(bounds.get('chatgpt')?.width).toBe(590);
    expect(bounds.get('claude')?.x).toBe(602);
  });

  it('can promote a focused provider into the single full-workspace slot', () => {
    const layout = new ProviderLayoutManager();
    layout.addProvider('chatgpt');
    layout.addProvider('claude');
    layout.setLayout('single');

    layout.setPrimaryProvider('claude');
    const bounds = layout.calculateBounds(1200, 800);

    expect(bounds.size).toBe(1);
    expect(bounds.get('claude')).toMatchObject({
      x: 8,
      y: 8,
      width: 1184,
      height: 784,
    });
    expect(bounds.has('chatgpt')).toBe(false);
  });

  it('gives grid mode a full-workspace slot when only one provider is open', () => {
    const layout = new ProviderLayoutManager();
    layout.addProvider('gemini');
    layout.setLayout('grid');

    const bounds = layout.calculateBounds(1200, 800);

    expect(bounds.size).toBe(1);
    expect(bounds.get('gemini')).toMatchObject({
      x: 8,
      y: 8,
      width: 1184,
      height: 784,
    });
  });
});
