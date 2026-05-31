import type { ChatRequest, ChatResponse, ProviderHealth } from '@tessera-gateway/core';
import { getLogger } from '@tessera-gateway/observability/logger.js';
import { BaseProviderAdapter } from '@tessera-gateway/provider-base/adapter.js';

const logger = getLogger({ name: 'provider-claude' });

export class ClaudeAdapter extends BaseProviderAdapter {
  readonly id = 'claude';
  readonly name = 'Claude';

  async execute(request: ChatRequest): Promise<ChatResponse> {
    logger.info({ model: request.model, messageCount: request.messages.length }, 'Claude adapter is stubbed');
    return this.createStubResponse();
  }

  async getHealth(): Promise<ProviderHealth> {
    return this.createStubHealth();
  }

  protected getWebsiteUrl(): string {
    return 'https://claude.ai';
  }
}

export const adapter = new ClaudeAdapter();
