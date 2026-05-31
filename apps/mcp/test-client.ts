interface ToolCallParams {
  name?: string;
  arguments?: Record<string, unknown>;
}

interface TestRequest {
  method: string;
  params: ToolCallParams;
}

const tools = [
  { name: 'list_providers', description: 'List all providers', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'get_provider_state',
    description: 'Get state',
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
  {
    name: 'focus_provider',
    description: 'Focus provider',
    inputSchema: {
      type: 'object',
      properties: { providerId: { type: 'string', enum: ['chatgpt', 'claude', 'gemini', 'perplexity'] } },
      required: ['providerId'],
    },
  },
  {
    name: 'set_layout',
    description: 'Set layout',
    inputSchema: {
      type: 'object',
      properties: { layout: { type: 'string', enum: ['single', 'split', 'grid'] } },
      required: ['layout'],
    },
  },
];

function handleToolsList() {
  return { tools };
}

function handleToolCall(name: string | undefined, args: Record<string, unknown> = {}) {
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
            text: JSON.stringify({ providerId: args?.providerId, status: 'stubbed', phase: 'scaffold_only' }),
          },
        ],
      };
    case 'open_provider':
    case 'close_provider':
    case 'focus_provider':
      return {
        content: [
          { type: 'text', text: JSON.stringify({ success: true, providerId: args?.providerId, action: name }) },
        ],
      };
    case 'set_layout':
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, layout: args?.layout }) }] };
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
}

const tests: TestRequest[] = [
  { method: 'tools/list', params: {} },
  { method: 'tools/call', params: { name: 'list_providers', arguments: {} } },
  { method: 'tools/call', params: { name: 'get_provider_state', arguments: { providerId: 'chatgpt' } } },
  { method: 'tools/call', params: { name: 'open_provider', arguments: { providerId: 'chatgpt' } } },
  { method: 'tools/call', params: { name: 'close_provider', arguments: { providerId: 'chatgpt' } } },
  { method: 'tools/call', params: { name: 'focus_provider', arguments: { providerId: 'claude' } } },
  { method: 'tools/call', params: { name: 'set_layout', arguments: { layout: 'split' } } },
];

for (const test of tests) {
  console.log('\n--- Test:', test.method, test.params?.name || '');
  try {
    if (test.method === 'tools/list') {
      const result = handleToolsList();
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      const result = handleToolCall(test.params.name, test.params.arguments);
      console.log('Result:', JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.error('Error:', e instanceof Error ? e.message : String(e));
  }
}
