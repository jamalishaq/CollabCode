import { z } from 'zod';

export const registerSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1)
    })
    .strict()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

export const logoutSchema = refreshSchema;

export const validateSchema = z.object({
  body: z.object({
    token: z.string().min(1)
  })
});
