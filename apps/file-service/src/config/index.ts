import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3003),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  KAFKA_BROKERS: z.string().min(1),
  LOCK_TTL_SECONDS: z.coerce.number().default(30)
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
