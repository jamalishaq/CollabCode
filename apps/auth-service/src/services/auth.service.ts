import type { JwtPayload } from '@collabcode/shared-types';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

import { config } from '../config';
import { AppError } from '../utils/app-error';
import { createRefreshToken, findRefreshToken, revokeRefreshToken } from '../repositories/token.repository';
import { createUser, findUserByEmail, findUserById, type UserWithProfile } from '../repositories/user.repository';
import { prisma } from '../lib/prisma';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

interface JwtAdapter {
  sign: (payload: object, options?: object) => string;
  verify: <T>(token: string, options?: object) => T;
}

function toPublicUser(user: UserWithProfile): {
  id: string;
  email: string;
  name: string;
  createdAt: string;
} {
  return {
    id: user.id,
    email: user.email,
    name: user.profile?.displayName ?? user.email,
    createdAt: user.createdAt.toISOString()
  };
}

export async function issueTokens(appJwt: JwtAdapter, user: UserWithProfile): Promise<SessionTokens> {
  const accessToken = appJwt.sign(
    { email: user.email },
    {
      sub: user.id,
      expiresIn: config.JWT_EXPIRY,
      issuer: 'collabcode-auth'
    }
  );

  const refreshToken = appJwt.sign(
    { type: 'refresh', nonce: randomUUID() },
    {
      sub: user.id,
      expiresIn: config.REFRESH_TOKEN_EXPIRY,
      secret: config.REFRESH_TOKEN_SECRET,
      issuer: 'collabcode-auth'
    }
  );

  const decodedRefreshToken = appJwt.verify<{ exp: number }>(refreshToken, { secret: config.REFRESH_TOKEN_SECRET });
  await createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(decodedRefreshToken.exp * 1000)
  });

  return { accessToken, refreshToken };
}

export async function registerUser(
  appJwt: JwtAdapter,
  params: { email: string; password: string; name: string }
): Promise<{ user: ReturnType<typeof toPublicUser>; tokens: SessionTokens }> {
  const existing = await findUserByEmail(params.email);
  if (existing) {
    throw new AppError('User with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(params.password, 12);
  const user = await createUser({
    email: params.email,
    passwordHash,
    name: params.name
  });

  const tokens = await issueTokens(appJwt, user);
  return { user: toPublicUser(user), tokens };
}

export async function loginUser(
  appJwt: JwtAdapter,
  params: { email: string; password: string }
): Promise<{ user: ReturnType<typeof toPublicUser>; tokens: SessionTokens }> {
  const user = await findUserByEmail(params.email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const validPassword = await bcrypt.compare(params.password, user.passwordHash);
  if (!validPassword) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokens = await issueTokens(appJwt, user);
  return { user: toPublicUser(user), tokens };
}

export async function refreshAccessToken(
  appJwt: JwtAdapter,
  refreshToken: string
): Promise<{ accessToken: string }> {
  const tokenRecord = await findRefreshToken(refreshToken);
  if (!tokenRecord || tokenRecord.revokedAt !== null || tokenRecord.expiresAt.getTime() <= Date.now()) {
    throw new AppError('Invalid refresh token.', 401);
  }

  try {
    appJwt.verify(refreshToken, { secret: config.REFRESH_TOKEN_SECRET });
  } catch {
    throw new AppError('Invalid refresh token.', 401);
  }

  const user = await findUserById(tokenRecord.userId);
  if (!user) {
    throw new AppError('User no longer exists.', 404);
  }

  const accessToken = appJwt.sign(
    { email: user.email },
    {
      sub: user.id,
      expiresIn: config.JWT_EXPIRY,
      issuer: 'collabcode-auth'
    }
  );

  return { accessToken };
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await revokeRefreshToken(refreshToken);
}

export async function getCurrentUser(userId: string): Promise<ReturnType<typeof toPublicUser>> {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return toPublicUser(user);
}

export async function validateAccessToken(
  appJwt: JwtAdapter,
  token: string
): Promise<JwtPayload> {
  try {
    const decoded = appJwt.verify<JwtPayload>(token);
    return decoded;
  } catch {
    throw new AppError('Invalid token.', 401);
  }
}

export async function cleanupAuthService(): Promise<void> {
  await prisma.$disconnect();
}
