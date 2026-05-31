import cors from '@fastify/cors';
import { chatRequestSchema, providerRegistry } from '@tessera-gateway/core';
import { createLogger } from '@tessera-gateway/observability/logger.js';
import { checkDesktopAvailable, getRuntimeState, listProviders, sendPrompt } from '@tessera-gateway/runtime';
import Fastify from 'fastify';

const logger = createLogger({ name: 'gateway' });

const fastify = Fastify({
  logger,
});

await fastify.register(cors, {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
});

function extractPrompt(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): {
  systemPrompt?: string;
  prompt: string;
} {
  const systemPrompt = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');
  const userMessage = [...messages].reverse().find((message) => message.role === 'user');

  return {
    systemPrompt: systemPrompt || undefined,
    prompt: userMessage?.content || '',
  };
}

fastify.get('/health', async () => {
  const desktopAvailable = await checkDesktopAvailable();
  return {
    status: 'ok',
    timestamp: Date.now(),
    version: '0.1.0',
    desktopAvailable,
  };
});

fastify.get('/v1/models', async () => {
  return {
    object: 'list',
    data: Object.values(providerRegistry).map((provider) => ({
      id: provider.id,
      name: provider.name,
      object: 'model',
      owned_by: 'tessera-gateway',
      status: provider.status,
    })),
  };
});

fastify.post('/v1/chat/completions', async (request, reply) => {
  const parsed = chatRequestSchema.parse(request.body);
  const { prompt, systemPrompt } = extractPrompt(parsed.messages);

  if (!prompt) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A user message is required',
      },
    });
  }

  const result = await sendPrompt(parsed.model, prompt, systemPrompt);
  const desktopAvailable = await checkDesktopAvailable();

  logger.info(
    {
      model: parsed.model,
      provider: result.providerId,
      latency: result.latencyMs,
      ok: result.ok,
      desktopAvailable,
    },
    'chat completion request',
  );

  if (!result.ok) {
    return reply.code(503).send({
      error: {
        code: result.error?.code ?? 'RUNTIME_ERROR',
        message: result.error?.message ?? 'Request failed',
        provider: result.providerId,
        retryable: result.error?.retryable ?? false,
      },
    });
  }

  return reply.send({
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: parsed.model,
    choices: [
      {
        message: {
          role: 'assistant',
          content: result.text,
        },
        finish_reason: 'stop',
        index: 0,
      },
    ],
    provider: result.providerId,
    latency_ms: result.latencyMs,
  });
});

fastify.get('/v1/providers/health', async () => {
  return {
    desktopAvailable: await checkDesktopAvailable(),
    providers: await listProviders(),
  };
});

fastify.get('/v1/runtime/state', async () => {
  return getRuntimeState();
});

const start = async () => {
  const port = Number.parseInt(process.env.PORT || '7860');
  const host = process.env.HOST || '127.0.0.1';

  try {
    await fastify.listen({ port, host });
    logger.info(`Gateway listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
