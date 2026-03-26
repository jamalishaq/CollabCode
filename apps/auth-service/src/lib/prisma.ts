import prismaClientModule from '@prisma/client';

interface RefreshTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface PrismaTxClient {
  refreshToken: {
    updateMany: (args: unknown) => Promise<{ count: number }>;
    create: (args: unknown) => Promise<unknown>;
  };
}

const { PrismaClient } = prismaClientModule as unknown as {
  PrismaClient: new () => {
    user: {
      findUnique: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
    };
    refreshToken: {
      create: (args: unknown) => Promise<unknown>;
      findUnique: (args: unknown) => Promise<RefreshTokenRecord | null>;
      updateMany: (args: unknown) => Promise<{ count: number }>;
    };
    $disconnect: () => Promise<void>;
    $transaction: <T>(operation: (tx: PrismaTxClient) => Promise<T>) => Promise<T>;
  };
};

export const prisma = new PrismaClient();
