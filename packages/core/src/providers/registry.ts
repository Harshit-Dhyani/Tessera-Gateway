import type { ProviderInfo } from './types';

export const providerRegistry: Record<string, ProviderInfo> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    aliases: ['gpt', 'openai', 'chatgpt'],
    capabilities: {
      streaming: true,
      vision: true,
      codeExecution: true,
    },
    authMethod: 'browser',
    status: 'stubbed',
    browserUrl: 'https://chat.openai.com',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    aliases: ['claude', 'sonnet', 'anthropic'],
    capabilities: {
      streaming: true,
      vision: true,
      codeExecution: true,
    },
    authMethod: 'browser',
    status: 'stubbed',
    browserUrl: 'https://claude.ai',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    aliases: ['gemini', 'google'],
    capabilities: {
      streaming: true,
      vision: true,
      codeExecution: true,
    },
    authMethod: 'browser',
    status: 'stubbed',
    browserUrl: 'https://gemini.google.com',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    aliases: ['perplexity', 'pplx'],
    capabilities: {
      streaming: true,
      vision: false,
      codeExecution: false,
    },
    authMethod: 'browser',
    status: 'stubbed',
    browserUrl: 'https://www.perplexity.ai',
  },
};

export function getProviderById(id: string): ProviderInfo | undefined {
  return providerRegistry[id.toLowerCase()];
}

export function getProviderByAlias(alias: string): ProviderInfo | undefined {
  const normalized = alias.toLowerCase();
  for (const provider of Object.values(providerRegistry)) {
    if (provider.aliases.includes(normalized)) {
      return provider;
    }
  }
  return undefined;
}

export function resolveProviderId(input: string): string | null {
  const byId = providerRegistry[input.toLowerCase()];
  if (byId) return byId.id;
  const byAlias = getProviderByAlias(input);
  return byAlias?.id ?? null;
}
