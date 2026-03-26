import { WorkspaceRole } from '@collabcode/shared-types';
import { success } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { getUserId } from '../middleware/auth.middleware';
import { inviteMemberService, removeMemberService, updateMemberRoleService } from '../services/member.service';

interface WorkspaceParams {
  workspaceId: string;
}

interface MemberParams extends WorkspaceParams {
  userId: string;
}

interface InviteMemberBody {
  userId: string;
  email: string;
  role: WorkspaceRole;
}

interface UpdateRoleBody {
  role: WorkspaceRole;
}

export async function inviteMemberHandler(
  request: FastifyRequest<{ Params: WorkspaceParams; Body: InviteMemberBody }>,
  reply: FastifyReply
): Promise<void> {
  const requesterId = getUserId(request);
  const member = await inviteMemberService(request.params.workspaceId, requesterId, request.body);

  reply.status(201).send(
    success({
      userId: member.userId,
      workspaceId: member.workspaceId,
      role: member.role
    })
  );
}

export async function updateMemberRoleHandler(
  request: FastifyRequest<{ Params: MemberParams; Body: UpdateRoleBody }>,
  reply: FastifyReply
): Promise<void> {
  const requesterId = getUserId(request);
  const member = await updateMemberRoleService(
    request.params.workspaceId,
    requesterId,
    request.params.userId,
    request.body.role
  );

  reply.send(
    success({
      userId: member.userId,
      role: member.role
    })
  );
}

export async function removeMemberHandler(
  request: FastifyRequest<{ Params: MemberParams }>,
  reply: FastifyReply
): Promise<void> {
  const requesterId = getUserId(request);
  await removeMemberService(request.params.workspaceId, requesterId, request.params.userId);

  reply.send(success({ success: true }));
}
