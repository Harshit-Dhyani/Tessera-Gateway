import { chatResponseSchema, createError, ErrorCodes, resolveProviderId } from '@tessera-gateway/core';
import type { IProviderAdapter } from '@tessera-gateway/provider-base';
import type { ChatRequest, ChatResponse, IRouter, ProviderHealth, RouterConfig } from './interfaces.js';

class Router implements IRouter {
  private providers: Map<string, IProviderAdapter>;

  constructor(_config: Partial<RouterConfig> = {}) {
    this.providers = new Map();
  }

  registerProvider(id: string, adapter: IProviderAdapter): void {
    this.providers.set(id, adapter);
  }

  async execute(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const providerId = resolveProviderId(request.model);

    if (!providerId) {
      const err = createError(ErrorCodes.ROUTER_INVALID_ALIAS, `Unknown model alias: ${request.model}`);
      throw new Error(err.message);
    }

    const adapter = this.providers.get(providerId);

    if (!adapter) {
      const stubResponse: ChatResponse = {
        id: `stub-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Provider not registered. This is a scaffold with stub responses only.',
            },
            finish_reason: 'stop',
            index: 0,
          },
        ],
        provider: providerId,
        latency_ms: Date.now() - startTime,
      };
      return chatResponseSchema.parse(stubResponse);
    }

    return adapter.execute(request);
  }

  async getProviderHealth(providerId: string): Promise<ProviderHealth> {
    const adapter = this.providers.get(providerId);

    if (!adapter) {
      return {
        status: 'stubbed',
        lastChecked: Date.now(),
        error: 'Provider not registered',
      };
    }

    return adapter.getHealth();
  }

  async getAllProviderHealth(): Promise<ProviderHealth[]> {
    const results: ProviderHealth[] = [];

    for (const [, adapter] of this.providers) {
      const health = await adapter.getHealth();
      results.push(health);
    }

    return results;
  }
}

let routerInstance: IRouter | null = null;

export function createRouter(config?: Partial<RouterConfig>): IRouter {
  routerInstance = new Router(config);
  return routerInstance;
}

export function getRouter(): IRouter {
  if (!routerInstance) {
    routerInstance = createRouter();
  }
  return routerInstance;
}

export type { IRouter, RouterConfig };
export { Router };
