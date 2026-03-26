import { WorkspaceRole } from '@collabcode/shared-types';
import { z } from 'zod';

const uuid = z.string().uuid();

export const workspaceParamsSchema = z.object({
  params: z.object({ workspaceId: uuid }),
  body: z.unknown().optional(),
  query: z.unknown().optional()
});

export const createWorkspaceSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional()
  })
});

export const updateWorkspaceSchema = z.object({
  params: z.object({ workspaceId: uuid }),
  query: z.object({}).optional(),
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional()
    })
    .refine((value) => value.name !== undefined || value.description !== undefined, {
      message: 'At least one field is required.'
    })
});

export const inviteMemberSchema = z.object({
  params: z.object({ workspaceId: uuid }),
  query: z.object({}).optional(),
  body: z.object({
    userId: uuid,
    email: z.string().email(),
    role: z.nativeEnum(WorkspaceRole)
  })
});

export const updateMemberRoleSchema = z.object({
  params: z.object({ workspaceId: uuid, userId: uuid }),
  query: z.object({}).optional(),
  body: z.object({ role: z.nativeEnum(WorkspaceRole) })
});

export const removeMemberSchema = z.object({
  params: z.object({ workspaceId: uuid, userId: uuid }),
  query: z.object({}).optional(),
  body: z.unknown().optional()
});

export const createProjectSchema = z.object({
  params: z.object({ workspaceId: uuid }),
  query: z.object({}).optional(),
  body: z.object({ name: z.string().min(1).max(100) })
});

export const projectParamsSchema = z.object({
  params: z.object({ workspaceId: uuid, projectId: uuid }),
  query: z.object({}).optional(),
  body: z.unknown().optional()
});

export const updateProjectSchema = z.object({
  params: z.object({ workspaceId: uuid, projectId: uuid }),
  query: z.object({}).optional(),
  body: z.object({ name: z.string().min(1).max(100) })
});
