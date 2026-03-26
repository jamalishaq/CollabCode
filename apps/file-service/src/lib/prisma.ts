import prismaClientModule from '@prisma/client';

interface FileRecord {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  path: string;
  language: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface FileVersionRecord {
  id: string;
  fileId: string;
  version: number;
  contentHash: string;
  createdBy: string;
  createdAt: Date;
}

const { PrismaClient } = prismaClientModule as unknown as {
  PrismaClient: new () => {
    file: {
      create: (args: unknown) => Promise<FileRecord>;
      findMany: (args: unknown) => Promise<FileRecord[]>;
      findFirst: (args: unknown) => Promise<FileRecord | null>;
      update: (args: unknown) => Promise<FileRecord>;
    };
    fileVersion: {
      findFirst: (args: unknown) => Promise<FileVersionRecord | null>;
      create: (args: unknown) => Promise<FileVersionRecord>;
    };
    $disconnect: () => Promise<void>;
  };
};

export const prisma = new PrismaClient();
export type { FileRecord, FileVersionRecord };
