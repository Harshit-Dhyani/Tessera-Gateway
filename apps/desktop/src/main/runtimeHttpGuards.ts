const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;

const ALLOWED_RUNTIME_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:7860',
  'http://127.0.0.1:7860',
]);

function isAllowedViteDevOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    const port = Number.parseInt(parsed.port, 10);
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      port >= 5173 &&
      port <= 5199
    );
  } catch {
    return false;
  }
}

export class RuntimeBodyTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`Runtime request body exceeds ${maxBytes} bytes`);
    this.name = 'RuntimeBodyTooLargeError';
  }
}

export function getAllowedRuntimeOrigin(origin: string | undefined): string | null {
  if (!origin) {
    return null;
  }

  return ALLOWED_RUNTIME_ORIGINS.has(origin) || isAllowedViteDevOrigin(origin) ? origin : null;
}

export function appendRuntimeBodyChunk(
  currentBody: string,
  chunk: Buffer | string,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): string {
  const nextBody = `${currentBody}${chunk.toString()}`;

  if (Buffer.byteLength(nextBody, 'utf8') > maxBytes) {
    throw new RuntimeBodyTooLargeError(maxBytes);
  }

  return nextBody;
}

export function parseRuntimeJsonBody(rawBody: string): Record<string, unknown> {
  if (!rawBody.trim()) {
    return {};
  }

  const parsed: unknown = JSON.parse(rawBody);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
}
