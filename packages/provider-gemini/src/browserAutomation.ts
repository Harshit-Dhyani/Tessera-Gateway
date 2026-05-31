import { type ErrorCode, ErrorCodes } from '@tessera-gateway/core';

export interface GeminiBrowserAutomationResult {
  ok: boolean;
  text: string;
  errorCode?: ErrorCode;
  errorMessage?: string;
  captureMethod?: string;
}

function escapeScriptValue(value: string): string {
  return JSON.stringify(value);
}

export function createGeminiPromptScript(prompt: string, timeoutMs = 120000): string {
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
    return pageText.includes('sign in') || pageText.includes('try gemini with your google account');
  };

  const findComposer = () => {
    const candidates = [
      'rich-textarea div[contenteditable="true"]',
      'rich-textarea [contenteditable="true"]',
      'div[aria-label*="Ask Gemini" i]',
      '[data-placeholder*="Ask Gemini" i]',
      'div[contenteditable="true"][aria-label*="Enter"]',
      'div[contenteditable="true"][aria-label*="prompt"]',
      'div[contenteditable="true"]',
      'rich-textarea textarea',
      'textarea[placeholder*="Ask Gemini" i]',
      'textarea[aria-label*="Enter"]',
      'textarea',
    ];

    for (const selector of candidates) {
      const element = Array.from(document.querySelectorAll(selector)).find(visible);
      if (element) return element;
    }
    return null;
  };

  const findSendButton = () => {
    const candidates = [
      'button[aria-label*="Send message" i]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Submit" i]',
      'button[aria-label*="send" i]',
      'button[data-test-id*="send" i]',
      'button[data-testid*="send"]',
      'button[mattooltip*="Send" i]',
      'button.send-button',
      'button[type="submit"]',
    ];

    for (const selector of candidates) {
      const element = Array.from(document.querySelectorAll(selector)).find((candidate) => {
        return visible(candidate) && !candidate.disabled && candidate.getAttribute('aria-disabled') !== 'true';
      });
      if (element) return element;
    }

    const labeledButton = Array.from(document.querySelectorAll('button')).find((candidate) => {
      if (!visible(candidate) || candidate.disabled || candidate.getAttribute('aria-disabled') === 'true') return false;
      const label = [
        candidate.getAttribute('aria-label'),
        candidate.getAttribute('title'),
        candidate.getAttribute('data-testid'),
        candidate.getAttribute('data-test-id'),
        candidate.textContent,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return label.includes('send') || label.includes('submit');
    });
    if (labeledButton) return labeledButton;

    return null;
  };

  const composerText = (composer) => {
    if ('value' in composer) return composer.value.trim();
    return textOf(composer);
  };

  const setNativeValue = (element, value) => {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor?.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  };

  const responseMessages = () => {
    const selectors = [
      'message-content',
      '.model-response-text',
      '[data-response-index]',
      'bard-response',
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
        if (text && text !== prompt && !text.toLowerCase().includes('gemini can make mistakes')) {
          messages.push(text);
        }
      }
      if (messages.length > 0) return messages;
    }
    return messages;
  };

  const setComposerText = (composer) => {
    composer.scrollIntoView({ block: 'center', inline: 'nearest' });
    composer.click();
    composer.focus();
    if ('value' in composer) {
      setNativeValue(composer, '');
      composer.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
      setNativeValue(composer, prompt);
      composer.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: prompt, bubbles: true }));
      composer.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(composer);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('delete', false);
    composer.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
    const insertRange = document.createRange();
    insertRange.selectNodeContents(composer);
    insertRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(insertRange);
    composer.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: prompt, bubbles: true }));
    document.execCommand('insertText', false, prompt);
    composer.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: prompt, bubbles: true }));
    composer.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const pressEnterToSubmit = (composer) => {
    composer.focus();
    const keydown = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    const keyup = new KeyboardEvent('keyup', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    composer.dispatchEvent(keydown);
    composer.dispatchEvent(keyup);
  };

  const promptWasSubmitted = (composer) => {
    const currentComposerText = composerText(composer);
    const pageText = document.body?.innerText || '';
    return currentComposerText.length === 0 || !currentComposerText.includes(prompt) || pageText.includes(prompt);
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
          ? 'Gemini requires a manual Google sign-in before prompt execution.'
          : 'Gemini composer was not found. Wait for the page to finish loading or verify the provider UI.',
        captureMethod: 'composer_lookup',
      });
    }

    const beforeMessages = responseMessages();
    const beforeLast = beforeMessages.at(-1) || '';
    setComposerText(composer);

    await sleep(150);
    if (!composerText(composer).includes(prompt)) {
      return result({
        ok: false,
        text: '',
        errorCode: ${escapeScriptValue(ErrorCodes.PROVIDER_NOT_READY)},
        errorMessage: 'Gemini composer did not keep the prompt after input synchronization.',
        captureMethod: 'composer_input_sync',
      });
    }

    let sendButton = findSendButton();
    while (!sendButton && Date.now() - startedAt < 10000) {
      await sleep(150);
      sendButton = findSendButton();
    }

    let submitMethod = 'send_button_click';
    if (sendButton) {
      sendButton.click();
    } else {
      submitMethod = 'keyboard_enter_fallback';
      pressEnterToSubmit(composer);
    }

    await sleep(750);
    if (!promptWasSubmitted(composer)) {
      return result({
        ok: false,
        text: '',
        errorCode: ${escapeScriptValue(ErrorCodes.PROVIDER_NOT_READY)},
        errorMessage: 'Gemini did not accept the prompt from the composer.',
        captureMethod: 'prompt_submission_check:' + submitMethod,
      });
    }

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
          captureMethod: 'gemini_response_stable_text:' + submitMethod,
        });
      }
    }

    return result({
      ok: false,
      text: lastText,
      errorCode: ${escapeScriptValue(ErrorCodes.PROVIDER_TIMEOUT)},
      errorMessage: 'Timed out waiting for a stable Gemini response.',
      captureMethod: 'gemini_response_stable_text:' + submitMethod,
    });
  })();
})()
`;
}
