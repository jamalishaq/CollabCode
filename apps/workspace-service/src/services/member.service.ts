import { WorkspaceRole } from '@collabcode/shared-types';

import { publishWorkspaceEvent } from '../events/producer';
import { upsertMember, updateMemberRole, deleteMember } from '../repositories/member.repository';
import { findWorkspaceById } from '../repositories/workspace.repository';
import { AppError } from '../utils/app-error';
import { requireRole } from './authorization.service';

export async function inviteMemberService(
  workspaceId: string,
  userId: string,
  input: { userId: string; email: string; role: WorkspaceRole }
) {
  await requireRole(workspaceId, userId, [WorkspaceRole.Owner]);

  const workspace = await findWorkspaceById(workspaceId);
  if (!workspace) {
    throw new AppError('Workspace not found.', 404, 'NOT_FOUND');
  }

  const member = await upsertMember(workspaceId, input.userId, input.role);

  await publishWorkspaceEvent('workspace.member.invited', {
    type: 'workspace.member.invited',
    workspaceId,
    workspaceName: workspace.name,
    invitedEmail: input.email,
    invitedByName: userId,
    role: input.role,
    timestamp: new Date().toISOString()
  });

  return member;
}

export async function updateMemberRoleService(
  workspaceId: string,
  requesterId: string,
  targetUserId: string,
  role: WorkspaceRole
) {
  await requireRole(workspaceId, requesterId, [WorkspaceRole.Owner]);
  return updateMemberRole(workspaceId, targetUserId, role);
}

export async function removeMemberService(workspaceId: string, requesterId: string, targetUserId: string) {
  await requireRole(workspaceId, requesterId, [WorkspaceRole.Owner]);
  await deleteMember(workspaceId, targetUserId);
}
