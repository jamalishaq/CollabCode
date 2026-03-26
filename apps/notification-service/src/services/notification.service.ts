import { MAX_EXECUTION_TIMEOUT_MS } from '@collabcode/shared-config';
import type { FastifyBaseLogger } from 'fastify';

import type {
  ExecutionCompletedEvent,
  LockConflictEvent,
  MemberInvitedEvent,
  WorkspaceCreatedEvent
} from '../schemas/notification.schema';
import { createEmailService } from './email.service';
import { createInAppService } from './inapp.service';

export type NotificationEvent =
  | MemberInvitedEvent
  | WorkspaceCreatedEvent
  | LockConflictEvent
  | ExecutionCompletedEvent;

export interface NotificationService {
  dispatch: (event: NotificationEvent) => Promise<void>;
  handleMemberInvited: (event: MemberInvitedEvent) => Promise<void>;
  handleWorkspaceCreated: (event: WorkspaceCreatedEvent) => Promise<void>;
  handleLockConflict: (event: LockConflictEvent) => Promise<void>;
  handleExecutionCompleted: (event: ExecutionCompletedEvent) => Promise<void>;
}

export function createNotificationService(logger: FastifyBaseLogger): NotificationService {
  const emailService = createEmailService(logger);
  const inAppService = createInAppService(logger);

  return {
    async dispatch(event: NotificationEvent): Promise<void> {
      switch (event.type) {
        case 'workspace.member.invited':
          await this.handleMemberInvited(event);
          break;
        case 'workspace.created':
          await this.handleWorkspaceCreated(event);
          break;
        case 'file.lock.conflict':
          await this.handleLockConflict(event);
          break;
        case 'execution.completed':
          await this.handleExecutionCompleted(event);
          break;
        default:
          logger.warn({ eventType: (event as { type: string }).type }, 'Unhandled notification event type.');
      }
    },

    async handleMemberInvited(event: MemberInvitedEvent): Promise<void> {
      await emailService.send({
        invitedEmail: event.invitedEmail,
        invitedByName: event.invitedByName,
        workspaceName: event.workspaceName,
        role: event.role
      });
    },

    async handleWorkspaceCreated(event: WorkspaceCreatedEvent): Promise<void> {
      await inAppService.send({
        userId: event.ownerId,
        title: 'Workspace created',
        message: `Workspace "${event.workspaceName}" is ready for collaboration.`,
        metadata: {
          workspaceId: event.workspaceId,
          createdAt: event.timestamp
        }
      });
    },

    async handleLockConflict(event: LockConflictEvent): Promise<void> {
      await inAppService.send({
        userId: event.requestedBy,
        title: 'File lock conflict',
        message: `File "${event.fileName}" is locked by another user.`,
        metadata: {
          fileId: event.fileId,
          lockedBy: event.lockedBy,
          expiresAt: event.expiresAt
        }
      });
    },

    async handleExecutionCompleted(event: ExecutionCompletedEvent): Promise<void> {
      await inAppService.send({
        userId: event.userId,
        title: event.exitCode === 0 ? 'Execution succeeded' : 'Execution failed',
        message: event.exitCode === 0 ? 'Your code execution completed successfully.' : 'Your code execution finished with errors.',
        metadata: {
          executionId: event.executionId,
          language: event.language,
          exitCode: event.exitCode,
          durationMs: event.durationMs,
          exceededRecommendedDuration: event.durationMs > MAX_EXECUTION_TIMEOUT_MS,
          stderrPreview: event.stderr.slice(0, 250),
          stdoutPreview: event.stdout.slice(0, 250)
        }
      });
    }
  };
}
