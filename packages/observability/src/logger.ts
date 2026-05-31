import pino from 'pino';

export interface LoggerOptions {
  level?: pino.Level;
  name?: string;
  redact?: string[];
  stderr?: boolean;
}

export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const loggerOptions: pino.LoggerOptions = {
    level: options.level ?? 'info',
    name: options.name ?? 'gateway',
    redact: options.redact ?? ['token', 'secret', 'key', 'cookie', 'sessionId', 'authorization'],
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  return options.stderr ? pino(loggerOptions, pino.destination(2)) : pino(loggerOptions);
}

export const defaultLogger = createLogger();

export function getLogger(options: LoggerOptions = {}): pino.Logger {
  return createLogger(options);
}

export function withRequestId(logger: pino.Logger, requestId: string): pino.Logger {
  return logger.child({ requestId });
}
