import { prisma } from '../lib/prisma';

export async function findMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    }
  });
}

export async function listMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function upsertMember(workspaceId: string, userId: string, role: string) {
  return prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    },
    create: { workspaceId, userId, role },
    update: { role }
  });
}

export async function updateMemberRole(workspaceId: string, userId: string, role: string) {
  return prisma.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    },
    data: { role }
  });
}

export async function deleteMember(workspaceId: string, userId: string) {
  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId
      }
    }
  });
}
