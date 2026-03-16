import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.string().min(1),
  LOGTAIL_SOURCE_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().min(1).includes('sslmode=require'),
  REDIS_URL: z.string().url().startsWith('rediss://'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(16),
  REFRESH_TOKEN_EXPIRY: z.string().min(1)
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);
