import type { ChatRequest, ChatResponse, ProviderHealth } from '@tessera-gateway/core';
import { getLogger } from '@tessera-gateway/observability/logger.js';
import { BaseProviderAdapter } from '@tessera-gateway/provider-base/adapter.js';

const logger = getLogger({ name: 'provider-perplexity' });

export class PerplexityAdapter extends BaseProviderAdapter {
  readonly id = 'perplexity';
  readonly name = 'Perplexity';

  async execute(request: ChatRequest): Promise<ChatResponse> {
    logger.info({ model: request.model, messageCount: request.messages.length }, 'Perplexity adapter is stubbed');
    return this.createStubResponse();
  }

  async getHealth(): Promise<ProviderHealth> {
    return this.createStubHealth();
  }

  protected getWebsiteUrl(): string {
    return 'https://www.perplexity.ai';
  }
}

export const adapter = new PerplexityAdapter();
