import { prisma } from '../lib/prisma';

export async function createWorkspace(input: { name: string; description?: string; ownerId: string }) {
  return prisma.$transaction(async (trx) => {
    const workspace = await trx.workspace.create({
      data: {
        name: input.name,
        description: input.description,
        ownerId: input.ownerId
      }
    });

    await trx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: input.ownerId,
        role: 'Owner'
      }
    });

    return workspace;
  });
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId, workspace: { deletedAt: null } },
    include: { workspace: true }
  });

  const workspaceIds = memberships.map((m) => m.workspaceId);
  const counts = await prisma.workspaceMember.groupBy({
    by: ['workspaceId'],
    where: { workspaceId: { in: workspaceIds } },
    _count: { workspaceId: true }
  });

  const countByWorkspace = new Map(counts.map((c) => [c.workspaceId, c._count.workspaceId]));

  return memberships.map((membership) => ({
    workspace: membership.workspace,
    role: membership.role,
    memberCount: countByWorkspace.get(membership.workspaceId) ?? 0
  }));
}

export async function findWorkspaceById(workspaceId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null }
  });
}

export async function updateWorkspace(workspaceId: string, input: { name?: string; description?: string | null }) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {})
    }
  });
}

export async function deleteWorkspace(workspaceId: string) {
  await prisma.workspace.delete({ where: { id: workspaceId } });
}
