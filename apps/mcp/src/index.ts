import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from '@tessera-gateway/observability/logger.js';
import {
  checkDesktopAvailable,
  closeProvider,
  focusProvider,
  getProviderState,
  getRuntimeState,
  listProviders,
  openParallelProviders,
  openProvider,
  providerRegistry,
  resetProviderSession,
  sendPrompt,
  setLayout,
} from '@tessera-gateway/runtime';

const logger = createLogger({ name: 'mcp', stderr: true });
const providerIds = Object.keys(providerRegistry);

function readProviderId(args: Record<string, unknown>): string | null {
  const providerId = args.providerId;
  if (typeof providerId !== 'string') return null;
  const normalized = providerId.trim().toLowerCase();
  return providerIds.includes(normalized) ? normalized : null;
}

function readProviderIds(args: Record<string, unknown>): string[] {
  const ids = args.providerIds;
  if (!Array.isArray(ids)) return [];
  return [
    ...new Set(
      ids
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map((id) => id.trim().toLowerCase())
        .filter((id) => providerIds.includes(id)),
    ),
  ];
}

function readLayout(args: Record<string, unknown>): 'single' | 'split' | 'grid' | null {
  const layout = args.layout;
  return layout === 'single' || layout === 'split' || layout === 'grid' ? layout : null;
}

const server = new Server(
  {
    name: 'tessera-gateway',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_providers',
        description: 'List all available AI providers and their current state',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_provider_state',
        description: 'Get detailed state of a specific provider',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: {
              type: 'string',
              enum: providerIds,
              description: 'Provider ID to get state for',
            },
          },
          required: ['providerId'],
        },
      },
      {
        name: 'open_provider',
        description: 'Open a provider in the desktop app',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: {
              type: 'string',
              enum: providerIds,
              description: 'Provider ID to open',
            },
          },
          required: ['providerId'],
        },
      },
      {
        name: 'close_provider',
        description: 'Close a provider in the desktop app',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: {
              type: 'string',
              enum: providerIds,
              description: 'Provider ID to close',
            },
          },
          required: ['providerId'],
        },
      },
      {
        name: 'focus_provider',
        description: 'Focus (bring to front) a specific provider',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: {
              type: 'string',
              enum: providerIds,
              description: 'Provider ID to focus',
            },
          },
          required: ['providerId'],
        },
      },
      {
        name: 'set_layout',
        description: 'Set the layout mode for provider views',
        inputSchema: {
          type: 'object',
          properties: {
            layout: {
              type: 'string',
              enum: ['single', 'split', 'grid'],
              description: 'Layout mode: single (one provider), split (two), grid (multiple)',
            },
          },
          required: ['layout'],
        },
      },
      {
        name: 'open_parallel_providers',
        description: 'Open multiple providers in parallel',
        inputSchema: {
          type: 'object',
          properties: {
            providerIds: {
              type: 'array',
              items: {
                type: 'string',
                enum: providerIds,
              },
              description: 'Array of provider IDs to open',
            },
          },
          required: ['providerIds'],
        },
      },
      {
        name: 'send_prompt',
        description: 'Send a prompt to a provider (requires desktop app running and provider open)',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: {
              type: 'string',
              enum: providerIds,
              description: 'Provider ID to send prompt to',
            },
            prompt: {
              type: 'string',
              description: 'Prompt to send',
            },
            systemPrompt: {
              type: 'string',
              description: 'Optional system prompt',
            },
          },
          required: ['providerId', 'prompt'],
        },
      },
      {
        name: 'reset_provider_session',
        description: 'Reset the session for a specific provider',
        inputSchema: {
          type: 'object',
          properties: {
            providerId: {
              type: 'string',
              enum: providerIds,
              description: 'Provider ID to reset session for',
            },
          },
          required: ['providerId'],
        },
      },
      {
        name: 'get_runtime_state',
        description: 'Get the current runtime state (layout, open providers, etc.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const requestId = `mcp-${Date.now()}`;
  const startTime = Date.now();
  const toolArgs = args ?? {};

  logger.info({ requestId, tool: name, args: toolArgs }, 'MCP tool call');

  try {
    switch (name) {
      case 'list_providers': {
        const providers = await listProviders();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ok: true, providers }, null, 2),
            },
          ],
        };
      }

      case 'get_provider_state': {
        const providerId = readProviderId(toolArgs);
        if (!providerId) {
          return errorResult('providerId must be a supported provider', 'VALIDATION_ERROR');
        }
        const state = await getProviderState(providerId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ok: true, state }, null, 2),
            },
          ],
        };
      }

      case 'open_provider': {
        const providerId = readProviderId(toolArgs);
        if (!providerId) {
          return errorResult('providerId must be a supported provider', 'VALIDATION_ERROR');
        }
        const result = await openProvider(providerId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'close_provider': {
        const providerId = readProviderId(toolArgs);
        if (!providerId) {
          return errorResult('providerId must be a supported provider', 'VALIDATION_ERROR');
        }
        const result = await closeProvider(providerId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'focus_provider': {
        const providerId = readProviderId(toolArgs);
        if (!providerId) {
          return errorResult('providerId must be a supported provider', 'VALIDATION_ERROR');
        }
        const result = await focusProvider(providerId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'set_layout': {
        const layout = readLayout(toolArgs);
        if (!layout) {
          return errorResult('layout must be single, split, or grid', 'VALIDATION_ERROR');
        }
        const result = await setLayout(layout);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'open_parallel_providers': {
        const providerIds = readProviderIds(toolArgs);
        if (providerIds.length === 0) {
          return errorResult('providerIds must include at least one supported provider', 'VALIDATION_ERROR');
        }
        const result = await openParallelProviders(providerIds);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ok: true, ...result }, null, 2),
            },
          ],
        };
      }

      case 'send_prompt': {
        const providerId = readProviderId(toolArgs);
        const prompt = toolArgs.prompt;
        const systemPrompt = typeof toolArgs.systemPrompt === 'string' ? toolArgs.systemPrompt : undefined;

        if (!providerId) {
          return errorResult('providerId must be a supported provider', 'VALIDATION_ERROR');
        }
        if (typeof prompt !== 'string' || !prompt.trim()) {
          return errorResult('prompt is required', 'VALIDATION_ERROR');
        }

        const result = await sendPrompt(providerId, prompt, systemPrompt);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'reset_provider_session': {
        const providerId = readProviderId(toolArgs);
        if (!providerId) {
          return errorResult('providerId must be a supported provider', 'VALIDATION_ERROR');
        }
        const result = await resetProviderSession(providerId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_runtime_state': {
        const state = await getRuntimeState();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ok: true, ...state }, null, 2),
            },
          ],
        };
      }

      default:
        return errorResult(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
    }
  } catch (error) {
    logger.error({ requestId, tool: name, error }, 'MCP tool execution failed');
    return errorResult(error instanceof Error ? error.message : 'Unknown error', 'RUNTIME_ERROR');
  } finally {
    const latency = Date.now() - startTime;
    logger.info({ requestId, tool: name, latency }, 'MCP tool call completed');
  }
});

function errorResult(message: string, code: string) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ ok: false, error: { code, message } }, null, 2),
      },
    ],
    isError: true,
  };
}

async function main() {
  const desktopAvailable = await checkDesktopAvailable();
  logger.info({ desktopAvailable }, 'MCP server starting');

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP server started and connected via stdio');
}

main().catch((error) => {
  logger.error(error, 'MCP server failed to start');
  process.exit(1);
});
