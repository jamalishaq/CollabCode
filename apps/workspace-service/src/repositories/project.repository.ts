import { prisma } from '../lib/prisma';

export async function createProject(workspaceId: string, name: string) {
  return prisma.project.create({
    data: { workspaceId, name }
  });
}

export async function listProjects(workspaceId: string) {
  return prisma.project.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: 'desc' }
  });
}

export async function findProject(workspaceId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, workspaceId, deletedAt: null }
  });
}

export async function updateProject(workspaceId: string, projectId: string, name: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { name }
  });
}

export async function deleteProject(workspaceId: string, projectId: string) {
  await prisma.project.delete({
    where: { id: projectId }
  });
}
