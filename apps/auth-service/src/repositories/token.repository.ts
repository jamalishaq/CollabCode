import { prisma } from '../lib/prisma';

export interface RefreshTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export async function createRefreshToken(params: {
  token: string;
  userId: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.refreshToken.create({
    data: params
  });
}

export async function findRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
  return prisma.refreshToken.findUnique({
    where: { token }
  }) as Promise<RefreshTokenRecord | null>;
}

export async function rotateRefreshToken(params: {
  currentToken: string;
  replacementToken: string;
  userId: string;
  replacementExpiresAt: Date;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const revoked = await tx.refreshToken.updateMany({
      where: {
        token: params.currentToken,
        userId: params.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    if (revoked.count !== 1) {
      return false;
    }

    await tx.refreshToken.create({
      data: {
        token: params.replacementToken,
        userId: params.userId,
        expiresAt: params.replacementExpiresAt
      }
    });

    return true;
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
