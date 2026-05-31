import cors from '@fastify/cors';
import { chatRequestSchema, providerRegistry } from '@tessera-gateway/core';
import { createLogger } from '@tessera-gateway/observability/logger.js';
import { checkDesktopAvailable, getRuntimeState, listProviders, sendPrompt } from '@tessera-gateway/runtime';
import Fastify from 'fastify';
import { ZodError } from 'zod';

const logger = createLogger({ name: 'gateway' });

const fastify = Fastify({
  logger,
});

const allowedCorsOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);

await fastify.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowedCorsOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed'), false);
  },
  methods: ['GET', 'POST'],
});

fastify.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body failed validation',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  if (error.message === 'Origin is not allowed') {
    return reply.code(403).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Origin is not allowed',
      },
    });
  }

  fastify.log.error(error);
  return reply.code(500).send({
    error: {
      code: 'RUNTIME_ERROR',
      message: 'Gateway request failed',
    },
  });
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
