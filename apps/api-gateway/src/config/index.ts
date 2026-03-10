import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16),
  AUTH_SERVICE_URL: z.string().url(),
  WORKSPACE_SERVICE_URL: z.string().url(),
  FILE_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  KAFKA_BROKERS: z.string().min(1),
  REDIS_URL: z.string().url()
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
