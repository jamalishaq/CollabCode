import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().min(1),
  LOGTAIL_SOURCE_TOKEN: z.string().min(1),
  AUTH_SERVICE_URL: z.string().url(),
  WORKSPACE_SERVICE_URL: z.string().url(),
  FILE_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  COLLABORATION_SERVICE_URL: z.string().url(),
  EXECUTION_SERVICE_URL: z.string().url(),
  REDIS_URL: z.string().url().startsWith('rediss://')
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
