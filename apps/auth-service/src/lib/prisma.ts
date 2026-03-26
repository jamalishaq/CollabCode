import prismaClientModule from '@prisma/client';

const { PrismaClient } = prismaClientModule as unknown as {
  PrismaClient: new () => {
    user: {
      findUnique: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
    };
    refreshToken: {
      create: (args: unknown) => Promise<unknown>;
      findUnique: (args: unknown) => Promise<unknown>;
      updateMany: (args: unknown) => Promise<unknown>;
    };
    $disconnect: () => Promise<void>;
  };
};

export const prisma = new PrismaClient();
