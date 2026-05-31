import type { ChatRequest, ChatResponse, ProviderHealth } from '@tessera-gateway/core';
import { getLogger } from '@tessera-gateway/observability/logger.js';
import { BaseProviderAdapter } from '@tessera-gateway/provider-base/adapter.js';

const logger = getLogger({ name: 'provider-gemini' });

export class GeminiAdapter extends BaseProviderAdapter {
  readonly id = 'gemini';
  readonly name = 'Gemini';

  async execute(request: ChatRequest): Promise<ChatResponse> {
    logger.info({ model: request.model, messageCount: request.messages.length }, 'Gemini adapter is stubbed');
    return this.createStubResponse();
  }

  async getHealth(): Promise<ProviderHealth> {
    return this.createStubHealth();
  }

  protected getWebsiteUrl(): string {
    return 'https://gemini.google.com';
  }
}

export const adapter = new GeminiAdapter();
