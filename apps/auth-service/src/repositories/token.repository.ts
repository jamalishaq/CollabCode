import { prisma } from '../lib/prisma';

export async function createRefreshToken(params: {
  token: string;
  userId: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.refreshToken.create({
    data: params
  });
}

export async function findRefreshToken(token: string): Promise<{
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
} | null> {
  return prisma.refreshToken.findUnique({
    where: { token }
  });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      token,
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
}
