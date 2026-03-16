import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3002),
  LOG_LEVEL: z.string().min(1),
  LOGTAIL_SOURCE_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().min(1).includes('sslmode=require'),
  REDIS_URL: z.string().url().startsWith('rediss://'),
  QSTASH_URL: z.string().url(),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
