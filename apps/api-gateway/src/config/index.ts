import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_ORIGIN: z.string().url().optional(),
  LOG_LEVEL: z.string().min(1).default('info'),
  LOGTAIL_SOURCE_TOKEN: z.string().min(1).optional(),
  AUTH_SERVICE_URL: z.string().url().default('https://collabcode-auth.onrender.com'),
  WORKSPACE_SERVICE_URL: z.string().url().default('https://collabcode-workspace.onrender.com'),
  FILE_SERVICE_URL: z.string().url().default('https://collabcode-file.onrender.com'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('https://collabcode-notification.onrender.com'),
  COLLABORATION_SERVICE_URL: z.string().url().default('https://collabcode-collaboration.onrender.com'),
  EXECUTION_SERVICE_URL: z.string().url().default('https://collabcode-execution.onrender.com'),
  REDIS_URL: z.string().url().startsWith('rediss://'),
  JWT_SECRET: z.string().min(1).optional()
});

/** Typed and validated service configuration. */
export const config = envSchema.parse(process.env);

export const rateLimitConfig = {
  windowSeconds: 60,
  userLimit: 100,
  ipLimit: 30,
  executeLimit: 10
} as const;

export const serviceMap = {
  auth: config.AUTH_SERVICE_URL,
  workspaces: config.WORKSPACE_SERVICE_URL,
  projects: config.FILE_SERVICE_URL,
  execute: config.EXECUTION_SERVICE_URL
} as const;
