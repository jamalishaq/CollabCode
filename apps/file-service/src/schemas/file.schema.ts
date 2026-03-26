import { z } from 'zod';

export const projectParamsSchema = z.object({
  params: z.object({
    projectId: z.string().uuid()
  })
});

export const fileParamsSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
    fileId: z.string().uuid()
  })
});

export const createFileSchema = z.object({
  params: z.object({
    projectId: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1),
    content: z.string().default(''),
    parentId: z.string().uuid().nullable().optional(),
    language: z.string().min(1).default('plaintext')
  })
});

export const patchFileSchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
    fileId: z.string().uuid()
  }),
  body: z.object({
    content: z.string()
  })
});
