import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  KAFKA_BROKERS: z.string().min(1)
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
