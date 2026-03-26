import prismaClientModule from '@prisma/client';

export interface WorkspaceRecord {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProjectRecord {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberWithWorkspaceRecord extends WorkspaceMemberRecord {
  workspace: WorkspaceRecord;
}

export interface WorkspaceMemberCountRecord {
  workspaceId: string;
  _count: {
    workspaceId: number;
  };
}

export interface TransactionClient {
  workspace: {
    create: (args: unknown) => Promise<WorkspaceRecord>;
  };
  workspaceMember: {
    create: (args: unknown) => Promise<WorkspaceMemberRecord>;
  };
}

const { PrismaClient } = prismaClientModule as unknown as {
  PrismaClient: new () => {
    workspace: {
      findFirst: (args: unknown) => Promise<WorkspaceRecord | null>;
      update: (args: unknown) => Promise<WorkspaceRecord>;
      delete: (args: unknown) => Promise<WorkspaceRecord>;
    };
    workspaceMember: {
      findMany: (args: unknown) => Promise<WorkspaceMemberRecord[]>;
      findUnique: (args: unknown) => Promise<WorkspaceMemberRecord | null>;
      upsert: (args: unknown) => Promise<WorkspaceMemberRecord>;
      update: (args: unknown) => Promise<WorkspaceMemberRecord>;
      delete: (args: unknown) => Promise<WorkspaceMemberRecord>;
      groupBy: (args: unknown) => Promise<WorkspaceMemberCountRecord[]>;
    };
    project: {
      create: (args: unknown) => Promise<ProjectRecord>;
      findMany: (args: unknown) => Promise<ProjectRecord[]>;
      findFirst: (args: unknown) => Promise<ProjectRecord | null>;
      update: (args: unknown) => Promise<ProjectRecord>;
      delete: (args: unknown) => Promise<ProjectRecord>;
    };
    $transaction: (fn: (tx: TransactionClient) => Promise<WorkspaceRecord>) => Promise<WorkspaceRecord>;
    $disconnect: () => Promise<void>;
  };
};

export const prisma = new PrismaClient();
