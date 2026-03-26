import { WorkspaceRole } from '@collabcode/shared-types';

import { findMembership } from '../repositories/member.repository';
import { AppError } from '../utils/app-error';

export async function requireRole(
  workspaceId: string,
  userId: string,
  allowedRoles: WorkspaceRole[]
): Promise<void> {
  const membership = await findMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError('Workspace access denied.', 403, 'FORBIDDEN');
  }

  if (!allowedRoles.includes(membership.role as WorkspaceRole)) {
    throw new AppError('Insufficient role for this operation.', 403, 'FORBIDDEN');
  }
}

export async function requireMembership(workspaceId: string, userId: string): Promise<void> {
  const membership = await findMembership(workspaceId, userId);

  if (!membership) {
    throw new AppError('Workspace access denied.', 403, 'FORBIDDEN');
  }
}
