import { RuntimeLanguage } from '@collabcode/shared-types';
import { z } from 'zod';

const isoDateString = z.string().datetime({ offset: true });

const webhookEnvelopeSchema = z.object({
  body: z.unknown(),
  query: z.unknown(),
  params: z.unknown()
});

export const memberInvitedSchema = webhookEnvelopeSchema.extend({
  body: z.object({
    type: z.literal('workspace.member.invited'),
    workspaceId: z.string().uuid(),
    workspaceName: z.string().min(1),
    invitedEmail: z.string().email(),
    invitedByName: z.string().min(1),
    role: z.string().min(1),
    timestamp: isoDateString
  })
});

export const workspaceCreatedSchema = webhookEnvelopeSchema.extend({
  body: z.object({
    type: z.literal('workspace.created'),
    workspaceId: z.string().uuid(),
    workspaceName: z.string().min(1),
    ownerId: z.string().uuid(),
    timestamp: isoDateString
  })
});

export const lockConflictSchema = webhookEnvelopeSchema.extend({
  body: z.object({
    type: z.literal('file.lock.conflict'),
    fileId: z.string().uuid(),
    fileName: z.string().min(1),
    requestedBy: z.string().uuid(),
    lockedBy: z.string().uuid().optional(),
    expiresAt: isoDateString.optional(),
    timestamp: isoDateString
  })
});

export const executionCompletedSchema = webhookEnvelopeSchema.extend({
  body: z.object({
    type: z.literal('execution.completed'),
    executionId: z.string().uuid(),
    userId: z.string().uuid(),
    language: z.nativeEnum(RuntimeLanguage),
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number().int(),
    durationMs: z.number().int().nonnegative(),
    timestamp: isoDateString
  })
});

export type MemberInvitedEvent = z.infer<typeof memberInvitedSchema>['body'];
export type WorkspaceCreatedEvent = z.infer<typeof workspaceCreatedSchema>['body'];
export type LockConflictEvent = z.infer<typeof lockConflictSchema>['body'];
export type ExecutionCompletedEvent = z.infer<typeof executionCompletedSchema>['body'];
