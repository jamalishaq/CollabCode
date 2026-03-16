import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3003),
  LOG_LEVEL: z.string().min(1),
  LOGTAIL_SOURCE_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().min(1).includes('sslmode=require'),
  REDIS_URL: z.string().url().startsWith('rediss://'),
  QSTASH_URL: z.string().url(),
  QSTASH_TOKEN: z.string().min(1),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
  LOCK_TTL_SECONDS: z.coerce.number().default(30),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url()
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
