import type { ChatRequest, ChatResponse, ProviderHealth } from '@tessera-gateway/core';
import { createError, ErrorCodes } from '@tessera-gateway/core';
import type { IProviderAdapter, ProviderMetadata } from './types.js';

export interface StubErrorResponse {
  error: {
    code: 'PROVIDER_NOT_IMPLEMENTED' | 'PROVIDER_NOT_AUTHENTICATED' | 'PROVIDER_UNAVAILABLE';
    provider: string;
    phase: 'scaffold_only';
    message: string;
    retryable: boolean;
  };
}

export abstract class BaseProviderAdapter implements IProviderAdapter {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract execute(request: ChatRequest): Promise<ChatResponse>;
  abstract getHealth(): Promise<ProviderHealth>;

  getMetadata(): ProviderMetadata {
    return {
      id: this.id,
      name: this.name,
      supportedModels: [this.id],
      requiresAuth: true,
      supportsStreaming: false,
      websiteUrl: this.getWebsiteUrl(),
    };
  }

  protected abstract getWebsiteUrl(): string;

  protected createStubErrorResponse(message?: string): StubErrorResponse {
    const err = createError(
      ErrorCodes.PROVIDER_NOT_IMPLEMENTED,
      message ?? `Provider automation not implemented in V1. ${this.name} adapter is a stub.`,
    );
    return {
      error: {
        code: 'PROVIDER_NOT_IMPLEMENTED',
        provider: this.id,
        phase: 'scaffold_only',
        message: err.message,
        retryable: err.retryable,
      },
    };
  }

  protected createStubResponse(): ChatResponse {
    return {
      id: `stub-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: this.id as ChatResponse['model'],
      choices: [
        {
          message: {
            role: 'assistant',
            content: `Provider automation not implemented in V1. ${this.name} adapter is a stub.`,
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
      provider: this.id,
    };
  }

  protected createStubHealth(): ProviderHealth {
    return {
      status: 'stubbed',
      lastChecked: Date.now(),
      error: 'Provider automation not implemented in V1',
    };
  }
}

export function createNotImplementedResponse(provider: string): ChatResponse {
  return {
    id: `stub-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: provider as ChatResponse['model'],
    choices: [
      {
        message: {
          role: 'assistant',
          content: `Provider automation not implemented in V1. ${provider} adapter is a stub.`,
        },
        finish_reason: 'stop',
        index: 0,
      },
    ],
    provider,
  };
}

export function createNotImplementedHealth(_provider: string): ProviderHealth {
  return {
    status: 'stubbed',
    lastChecked: Date.now(),
    error: 'Provider automation not implemented in V1',
  };
}
