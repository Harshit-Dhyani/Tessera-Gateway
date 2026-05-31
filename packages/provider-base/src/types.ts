export interface IProviderAdapter {
  readonly id: string;
  readonly name: string;
  execute(request: ChatRequest): Promise<ChatResponse>;
  getHealth(): Promise<ProviderHealth>;
  getMetadata(): ProviderMetadata;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  supportedModels: string[];
  requiresAuth: boolean;
  supportsStreaming: boolean;
  websiteUrl: string;
}

export type { ChatRequest, ChatResponse, ProviderHealth } from '@tessera-gateway/core';
