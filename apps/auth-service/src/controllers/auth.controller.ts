import { success } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  validateAccessToken
} from '../services/auth.service';

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

interface ValidateBody {
  token: string;
}

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
): Promise<void> {
  const { user, tokens } = await registerUser(request.server.jwt, request.body);
  reply.status(201).send(
    success({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    })
  );
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
): Promise<void> {
  const { user, tokens } = await loginUser(request.server.jwt, request.body);
  reply.send(
    success({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    })
  );
}

export async function refreshHandler(
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply
): Promise<void> {
  const data = await refreshAccessToken(request.server.jwt, request.body.refreshToken);
  reply.send(success(data));
}

export async function logoutHandler(
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply
): Promise<void> {
  await logoutUser(request.body.refreshToken);
  reply.send(success({ success: true }));
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await getCurrentUser(request.authUser.userId);
  reply.send(success(user));
}

export async function validateHandler(
  request: FastifyRequest<{ Body: ValidateBody }>,
  reply: FastifyReply
): Promise<void> {
  const payload = await validateAccessToken(request.server.jwt, request.body.token);
  reply.send(success(payload));
}

export async function oauthPlaceholderHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.status(501).send(
    success({
      message: 'OAuth flow is not implemented yet.'
    })
  );
}
