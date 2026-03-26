import { prisma } from '../lib/prisma';

export interface UserWithProfile {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  profile: {
    displayName: string;
  } | null;
}

export async function findUserByEmail(email: string): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });
}

export async function findUserById(id: string): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true }
  });
}

export async function createUser(params: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<UserWithProfile> {
  return prisma.user.create({
    data: {
      email: params.email,
      passwordHash: params.passwordHash,
      profile: {
        create: {
          displayName: params.name
        }
      }
    },
    include: { profile: true }
  });
}
