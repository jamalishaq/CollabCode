import { WorkspaceRole } from '@collabcode/shared-types';
import type { FastifyBaseLogger } from 'fastify';

interface InvitationEmailPayload {
  invitedEmail: string;
  invitedByName: string;
  workspaceName: string;
  role: string;
}

interface EmailService {
  send: (payload: InvitationEmailPayload) => Promise<void>;
}

function normalizeRole(rawRole: string): WorkspaceRole | string {
  const normalized = rawRole.trim().toLowerCase();

  if (normalized === 'owner') {
    return WorkspaceRole.Owner;
  }

  if (normalized === 'editor') {
    return WorkspaceRole.Editor;
  }

  if (normalized === 'viewer') {
    return WorkspaceRole.Viewer;
  }

  return rawRole;
}

export function createEmailService(logger: FastifyBaseLogger): EmailService {
  return {
    async send(payload: InvitationEmailPayload): Promise<void> {
      const role = normalizeRole(payload.role);

      logger.info(
        {
          event: 'notification.email.sent',
          recipient: payload.invitedEmail,
          invitedByName: payload.invitedByName,
          workspaceName: payload.workspaceName,
          role
        },
        'Workspace invitation email delivered.'
      );
    }
  };
}
