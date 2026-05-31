import { checkDesktopAvailable, getRuntimeState, sendPrompt } from '@tessera-gateway/runtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('runtime contracts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a normalized success response when the bridge succeeds', async () => {
    const fetchMock = vi.fn(async (input: string) => {
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
          text: 'normalized result',
          latencyMs: 42,
          loadState: 'ready',
          error: null,
          providerName: 'ChatGPT',
          requestId: 'req-123',
        });
      }

      return jsonResponse({}, 404);
    });

    vi.stubGlobal('fetch', fetchMock);

    const available = await checkDesktopAvailable();
    const response = await sendPrompt('auto', 'Hello there');

    expect(available).toBe(true);
    expect(response.ok).toBe(true);
    expect(response.providerId).toBe('chatgpt');
    expect(response.text).toBe('normalized result');
    expect(response.requestId).toBe('req-123');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('returns a truthful not-ready error when the provider is not open', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (input.endsWith('/health')) {
          return jsonResponse({ status: 'ok' });
        }

        if (input.endsWith('/runtime/providers/state')) {
          return jsonResponse([
            {
              providerId: 'claude',
              allowedDomain: 'https://claude.ai',
              currentUrl: '',
              title: '',
              isOpen: false,
              isCreated: false,
              isMounted: false,
              isVisible: false,
              participatesInLayout: false,
              isActive: false,
              isFocused: false,
              loadState: 'idle',
              canGoBack: false,
              canGoForward: false,
              isLoggedIn: false,
              isExecuting: false,
            },
          ]);
        }

        return jsonResponse({}, 404);
      }),
    );

    const response = await sendPrompt('claude', 'Hello');

    expect(response.ok).toBe(false);
    expect(response.error?.code).toBe('PROVIDER_NOT_READY');
  });

  it('lets browser-automation providers defer auth decisions to provider page scripts', async () => {
    const fetchMock = vi.fn(async (input: string) => {
      if (input.endsWith('/health')) {
        return jsonResponse({ status: 'ok' });
      }

      if (input.endsWith('/runtime/providers/state')) {
        return jsonResponse([
          {
            providerId: 'perplexity',
            allowedDomain: 'https://www.perplexity.ai',
            currentUrl: 'https://www.perplexity.ai',
            title: 'Perplexity',
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
            isLoggedIn: false,
            isExecuting: false,
          },
        ]);
      }

      if (input.endsWith('/runtime/providers/sendPrompt')) {
        return jsonResponse({
          ok: true,
          providerId: 'perplexity',
          model: 'perplexity',
          text: 'no-login page result',
          latencyMs: 7211,
          loadState: 'ready',
          error: null,
          providerName: 'Perplexity',
        });
      }

      return jsonResponse({}, 404);
    });

    vi.stubGlobal('fetch', fetchMock);

    const response = await sendPrompt('perplexity', 'Hello');

    expect(response.ok).toBe(true);
    expect(response.providerId).toBe('perplexity');
    expect(response.text).toBe('no-login page result');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:7870/runtime/providers/sendPrompt',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps non-implemented providers behind the runtime auth gate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (input.endsWith('/health')) {
          return jsonResponse({ status: 'ok' });
        }

        if (input.endsWith('/runtime/providers/state')) {
          return jsonResponse([
            {
              providerId: 'claude',
              allowedDomain: 'https://claude.ai',
              currentUrl: 'https://claude.ai',
              title: 'Claude',
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
              isLoggedIn: false,
              isExecuting: false,
            },
          ]);
        }

        return jsonResponse({}, 404);
      }),
    );

    const response = await sendPrompt('claude', 'Hello');

    expect(response.ok).toBe(false);
    expect(response.error?.code).toBe('PROVIDER_NOT_AUTHENTICATED');
  });

  it('reports the runtime state with truthful defaults when the bridge is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    const state = await getRuntimeState();

    expect(state.desktopAvailable).toBe(false);
    expect(state.currentLayout).toBe('single');
    expect(state.providersScreenActive).toBe(false);
  });
});
