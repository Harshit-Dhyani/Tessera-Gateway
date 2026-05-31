import type { ChatRequest, ChatResponse, ProviderHealth } from '@tessera-gateway/core';
import { getLogger } from '@tessera-gateway/observability/logger.js';
import { BaseProviderAdapter } from '@tessera-gateway/provider-base/adapter.js';

const logger = getLogger({ name: 'provider-chatgpt' });

export class ChatGPTAdapter extends BaseProviderAdapter {
  readonly id = 'chatgpt';
  readonly name = 'ChatGPT';

  async execute(request: ChatRequest): Promise<ChatResponse> {
    logger.info({ model: request.model, messageCount: request.messages.length }, 'ChatGPT adapter is stubbed');
    return this.createStubResponse();
  }

  async getHealth(): Promise<ProviderHealth> {
    return this.createStubHealth();
  }

  protected getWebsiteUrl(): string {
    return 'https://chat.openai.com';
  }
}

export const adapter = new ChatGPTAdapter();
