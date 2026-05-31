import { type ErrorCode, ErrorCodes } from '@tessera-gateway/core';

export interface PerplexityBrowserAutomationResult {
  ok: boolean;
  text: string;
  errorCode?: ErrorCode;
  errorMessage?: string;
  captureMethod?: string;
}

function escapeScriptValue(value: string): string {
  return JSON.stringify(value);
}

export function createPerplexityPromptScript(prompt: string, timeoutMs = 120000): string {
  return `
(() => {
  const prompt = ${escapeScriptValue(prompt)};
  const timeoutMs = ${timeoutMs};
  const startedAt = Date.now();
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const visible = (element) => {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const textOf = (element) => (element?.innerText || element?.textContent || '').trim();
  const result = (payload) => payload;

  const pageNeedsLogin = () => {
    const pageText = document.body?.innerText?.toLowerCase() || '';
    return pageText.includes('sign in') && pageText.includes('continue with');
  };

  const findComposer = () => {
    const candidates = [
      'textarea[placeholder*="Ask"]',
      'textarea[aria-label*="Ask"]',
      'textarea',
      'div[contenteditable="true"][aria-label*="Ask"]',
      'div[contenteditable="true"]',
    ];

    for (const selector of candidates) {
      const element = Array.from(document.querySelectorAll(selector)).find(visible);
      if (element) return element;
    }
    return null;
  };

  const findSendButton = () => {
    const candidates = [
      'button[aria-label*="Submit"]',
      'button[aria-label*="Send"]',
      'button[data-testid*="submit"]',
      'button[type="submit"]',
    ];

    for (const selector of candidates) {
      const element = Array.from(document.querySelectorAll(selector)).find((candidate) => {
        return visible(candidate) && !candidate.disabled && candidate.getAttribute('aria-disabled') !== 'true';
      });
      if (element) return element;
    }
    return null;
  };

  const responseMessages = () => {
    const selectors = [
      '[data-testid*="answer"]',
      '[data-testid*="thread"] article',
      '.prose',
      'article',
      'main',
    ];
    const seen = new Set();
    const messages = [];
    for (const selector of selectors) {
      for (const element of Array.from(document.querySelectorAll(selector))) {
        if (seen.has(element)) continue;
        seen.add(element);
        const text = textOf(element);
        if (text && text !== prompt && !text.toLowerCase().includes('related')) {
          messages.push(text);
        }
      }
      if (messages.length > 0) return messages;
    }
    return messages;
  };

  const setComposerText = (composer) => {
    composer.focus();
    if ('value' in composer) {
      composer.value = prompt;
      composer.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: prompt, bubbles: true }));
      composer.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    composer.textContent = '';
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composer);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('insertText', false, prompt);
    composer.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: prompt, bubbles: true }));
  };

  return (async () => {
    const composer = findComposer();
    if (!composer) {
      return result({
        ok: false,
        text: '',
        errorCode: pageNeedsLogin()
          ? ${escapeScriptValue(ErrorCodes.PROVIDER_NOT_AUTHENTICATED)}
          : ${escapeScriptValue(ErrorCodes.PROVIDER_NOT_READY)},
        errorMessage: pageNeedsLogin()
          ? 'Perplexity requires manual sign-in before prompt execution.'
          : 'Perplexity composer was not found. Wait for the page to finish loading or verify the provider UI.',
        captureMethod: 'composer_lookup',
      });
    }

    const beforeMessages = responseMessages();
    const beforeLast = beforeMessages.at(-1) || '';
    setComposerText(composer);

    let sendButton = findSendButton();
    while (!sendButton && Date.now() - startedAt < 10000) {
      await sleep(150);
      sendButton = findSendButton();
    }

    if (!sendButton) {
      return result({
        ok: false,
        text: '',
        errorCode: ${escapeScriptValue(ErrorCodes.PROVIDER_NOT_READY)},
        errorMessage: 'Perplexity send button was not ready.',
        captureMethod: 'send_button_lookup',
      });
    }

    sendButton.click();

    let lastText = '';
    let stableSince = 0;
    while (Date.now() - startedAt < timeoutMs) {
      await sleep(500);
      const messages = responseMessages();
      const candidate = messages.at(-1) || '';
      const changedFromBaseline = candidate && candidate !== beforeLast;

      if (!changedFromBaseline) continue;

      if (candidate !== lastText) {
        lastText = candidate;
        stableSince = Date.now();
        continue;
      }

      if (Date.now() - stableSince >= 2000) {
        return result({
          ok: true,
          text: candidate,
          captureMethod: 'perplexity_response_stable_text',
        });
      }
    }

    return result({
      ok: false,
      text: lastText,
      errorCode: ${escapeScriptValue(ErrorCodes.PROVIDER_TIMEOUT)},
      errorMessage: 'Timed out waiting for a stable Perplexity response.',
      captureMethod: 'perplexity_response_stable_text',
    });
  })();
})()
`;
}
