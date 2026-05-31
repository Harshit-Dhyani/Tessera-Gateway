import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRuntimeState, sendPrompt } from '../../packages/runtime/src/runtime';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('runtime integration smoke', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes auto through the first provider and reports runtime truth', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (input.endsWith('/health')) {
          return jsonResponse({ status: 'ok' });
        }

        if (input.endsWith('/runtime/providers/state')) {
          return jsonResponse([
            {
              providerId: 'chatgpt',
              allowedDomain: 'https://chat.openai.com',
              currentUrl: 'https://chat.openai.com',
              title: 'ChatGPT',
              isOpen: true,
              isCreated: true,
              isMounted: true,
              isVisible: true,
              participatesInLayout: true,
              isActive: true,
              isFocused: true,
              loadState: 'ready',
              canGoBack: false,
              canGoForward: false,
              isLoggedIn: true,
              isExecuting: false,
            },
          ]);
        }

        if (input.endsWith('/runtime/providers/sendPrompt')) {
          return jsonResponse({
            ok: true,
            providerId: 'chatgpt',
            model: 'chatgpt',
            text: 'integration smoke',
            latencyMs: 12,
            loadState: 'ready',
            error: null,
            providerName: 'ChatGPT',
            requestId: 'req-integration',
          });
        }

        if (input.endsWith('/runtime/state')) {
          return jsonResponse({
            desktopAvailable: true,
            currentLayout: 'single',
            openProviders: ['chatgpt'],
            visibleProviders: ['chatgpt'],
            focusedProvider: 'chatgpt',
            activeProvider: 'chatgpt',
            providersScreenActive: true,
          });
        }

        return jsonResponse({}, 404);
      }),
    );

    const response = await sendPrompt('auto', 'Integration smoke');
    const state = await getRuntimeState();

    expect(response.ok).toBe(true);
    expect(response.providerId).toBe('chatgpt');
    expect(response.text).toBe('integration smoke');
    expect(state.desktopAvailable).toBe(true);
    expect(state.focusedProvider).toBe('chatgpt');
  });
});
