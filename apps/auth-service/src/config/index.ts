import { LOCK_TTL_SECONDS } from '@collabcode/shared-config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z.string().min(1).default('info'),
  LOGTAIL_SOURCE_TOKEN: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().min(1).default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(16),
  REFRESH_TOKEN_EXPIRY: z.string().min(1).default('7d')
});

const parsedEnv = envSchema.parse(process.env);

/** Typed and validated service configuration. */
export const config = {
  ...parsedEnv,
  tokenClockSkewSeconds: LOCK_TTL_SECONDS
};
