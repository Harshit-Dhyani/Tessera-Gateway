import process from 'node:process';

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

async function handleToolsList() {
  return { tools };
}

function handleToolCall(name, args) {
  console.error('Tool:', name, args);
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

let buffer = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      console.error('Received:', msg.method);

      if (msg.method === 'tools/list') {
        const result = await handleToolsList();
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }) + '\n');
      } else if (msg.method === 'tools/call') {
        const result = handleToolCall(msg.params?.name, msg.params?.arguments);
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }) + '\n');
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
});
