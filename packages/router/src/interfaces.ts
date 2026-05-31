import type { ChatRequest, ChatResponse, ModelAlias, ProviderHealth } from '@tessera-gateway/core';
import type { IProviderAdapter } from '@tessera-gateway/provider-base';

export interface IRouter {
  execute(request: ChatRequest): Promise<ChatResponse>;
  getProviderHealth(providerId: string): Promise<ProviderHealth>;
  getAllProviderHealth(): Promise<ProviderHealth[]>;
  registerProvider(id: string, adapter: IProviderAdapter): void;
}

export interface RouterConfig {
  defaultProvider?: ModelAlias;
  fallbackEnabled: boolean;
  timeoutMs: number;
}

export type { ChatRequest, ChatResponse, ModelAlias, ProviderHealth };
