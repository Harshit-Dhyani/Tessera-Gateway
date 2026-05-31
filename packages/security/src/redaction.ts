const SECRET_PATHS = [
  'token',
  'secret',
  'key',
  'password',
  'cookie',
  'authorization',
  'sessionId',
  'session_id',
  'api_key',
  'apikey',
];

export function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSecret = SECRET_PATHS.some((secret) => key.toLowerCase().includes(secret.toLowerCase()));
      result[key] = isSecret ? '[REDACTED]' : redactObject(value);
    }
    return result;
  }

  return obj;
}

export function redactString(str: string): string {
  let redacted = str;
  for (const secret of SECRET_PATHS) {
    const regex = new RegExp(`(${secret}[=:"\\s]+)([^&\\s"']+)`, 'gi');
    redacted = redacted.replace(regex, `$1[REDACTED]`);
  }
  return redacted;
}
