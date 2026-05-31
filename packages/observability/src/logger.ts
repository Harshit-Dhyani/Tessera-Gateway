import pino from 'pino';

export interface LoggerOptions {
  level?: pino.Level;
  name?: string;
  redact?: string[];
}

export function createLogger(options: LoggerOptions = {}): pino.Logger {
  return pino({
    level: options.level || 'info',
    name: options.name || 'gateway',
    redact: options.redact || ['token', 'secret', 'key', 'cookie', 'sessionId', 'authorization'],
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export const defaultLogger = createLogger();

export function getLogger(options: LoggerOptions = {}): pino.Logger {
  return createLogger(options);
}

export function withRequestId(logger: pino.Logger, requestId: string): pino.Logger {
  return logger.child({ requestId });
}
