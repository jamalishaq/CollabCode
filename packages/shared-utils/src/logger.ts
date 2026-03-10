import pino from 'pino';

/** Structured logger instance for CollabCode services. */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: process.env.SERVICE_NAME ?? 'unknown-service'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});
