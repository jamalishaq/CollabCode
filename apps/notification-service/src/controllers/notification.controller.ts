import { success } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type {
  ExecutionCompletedEvent,
  LockConflictEvent,
  MemberInvitedEvent,
  WorkspaceCreatedEvent
} from '../schemas/notification.schema';
import { createNotificationService } from '../services/notification.service';

export async function memberInvitedHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = createNotificationService(request.log);
  await service.handleMemberInvited(request.body as MemberInvitedEvent);
  reply.send(success({ delivered: true }));
}

export async function workspaceCreatedHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = createNotificationService(request.log);
  await service.handleWorkspaceCreated(request.body as WorkspaceCreatedEvent);
  reply.send(success({ delivered: true }));
}

export async function lockConflictHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = createNotificationService(request.log);
  await service.handleLockConflict(request.body as LockConflictEvent);
  reply.send(success({ delivered: true }));
}

export async function executionCompletedHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = createNotificationService(request.log);
  await service.handleExecutionCompleted(request.body as ExecutionCompletedEvent);
  reply.send(success({ delivered: true }));
}
