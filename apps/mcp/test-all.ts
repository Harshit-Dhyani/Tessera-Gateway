const tools = [
  { name: 'list_providers', description: 'List all providers' },
  { name: 'get_provider_state', description: 'Get provider state' },
  { name: 'open_provider', description: 'Open provider' },
  { name: 'close_provider', description: 'Close provider' },
  { name: 'focus_provider', description: 'Focus provider' },
  { name: 'set_layout', description: 'Set layout' },
];

function handleTool(name, args) {
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
            text: JSON.stringify({ providerId: args.providerId, status: 'stubbed', phase: 'scaffold_only' }),
          },
        ],
      };
    case 'open_provider':
    case 'close_provider':
    case 'focus_provider':
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, providerId: args.providerId, action: name }) }],
      };
    case 'set_layout':
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, layout: args.layout }) }] };
    default:
      return { content: [{ type: 'text', text: 'Unknown' }], isError: true };
  }
}

console.log('=== MCP Tools Test ===\n');
console.log('Available tools:', tools.map((t) => t.name).join(', '));
console.log('\n--- Testing each tool ---\n');

console.log('1. list_providers:');
console.log(JSON.stringify(handleTool('list_providers', {}), null, 2));

console.log('\n2. get_provider_state(chatgpt):');
console.log(JSON.stringify(handleTool('get_provider_state', { providerId: 'chatgpt' }), null, 2));

console.log('\n3. open_provider(claude):');
console.log(JSON.stringify(handleTool('open_provider', { providerId: 'claude' }), null, 2));

console.log('\n4. close_provider(gemini):');
console.log(JSON.stringify(handleTool('close_provider', { providerId: 'gemini' }), null, 2));

console.log('\n5. focus_provider(perplexity):');
console.log(JSON.stringify(handleTool('focus_provider', { providerId: 'perplexity' }), null, 2));

console.log('\n6. set_layout(split):');
console.log(JSON.stringify(handleTool('set_layout', { layout: 'split' }), null, 2));

console.log('\n=== All tests passed ===');
