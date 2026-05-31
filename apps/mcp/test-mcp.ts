import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from '@tessera-gateway/observability/logger.js';

const logger = createLogger({ name: 'mcp-test' });

const server = new Server({ name: 'tessera-gateway', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Listing tools');
  return {
    tools: [
      { name: 'list_providers', description: 'List providers', inputSchema: { type: 'object', properties: {} } },
      {
        name: 'get_provider_state',
        description: 'Get provider state',
        inputSchema: {
          type: 'object',
          properties: { providerId: { type: 'string', enum: ['chatgpt', 'claude', 'gemini', 'perplexity'] } },
          required: ['providerId'],
        },
      },
      {
        name: 'open_provider',
        description: 'Open provider',
        inputSchema: {
          type: 'object',
          properties: { providerId: { type: 'string', enum: ['chatgpt', 'claude', 'gemini', 'perplexity'] } },
          required: ['providerId'],
        },
      },
      {
        name: 'close_provider',
        description: 'Close provider',
        inputSchema: {
          type: 'object',
          properties: { providerId: { type: 'string', enum: ['chatgpt', 'claude', 'gemini', 'perplexity'] } },
          required: ['providerId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.info({ tool: name, args }, 'Calling tool');
  const toolArgs = args ?? {};

  switch (name) {
    case 'list_providers':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              providers: [
                { id: 'chatgpt', status: 'stubbed' },
                { id: 'claude', status: 'stubbed' },
                { id: 'gemini', status: 'stubbed' },
                { id: 'perplexity', status: 'stubbed' },
              ],
            }),
          },
        ],
      };
    case 'get_provider_state':
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ providerId: toolArgs.providerId, status: 'stubbed', phase: 'scaffold_only' }),
          },
        ],
      };
    case 'open_provider':
    case 'close_provider':
      return {
        content: [
          { type: 'text', text: JSON.stringify({ success: true, providerId: toolArgs.providerId, action: name }) },
        ],
      };
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP test server ready');
}

main().catch((error) => {
  logger.error(error, 'MCP test failed');
  process.exit(1);
});
