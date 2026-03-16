import pino from 'pino';

/** Structured logger instance for CollabCode services. */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: process.env.SERVICE_NAME ?? 'unknown-service'
  },
  transport: process.env.NODE_ENV === 'production'
    ? {
        target: '@logtail/pino',  // ships to Grafana Loki via Logtail integration
        options: {
          sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
        },
      }
    : { target: 'pino-pretty' },  // readable logs in local dev
    timestamp: pino.stdTimeFunctions.isoTime
});