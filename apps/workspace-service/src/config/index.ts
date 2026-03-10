import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  KAFKA_BROKERS: z.string().min(1)
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
