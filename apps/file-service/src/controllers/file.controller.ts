import { success } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  acquireLock,
  createFile,
  deleteFile,
  getFile,
  listFiles,
  releaseLock,
  renewLock,
  updateFile
} from '../services/file.service';
import { AppError } from '../utils/app-error';

function getUserId(request: FastifyRequest): string {
  const userId = request.headers['x-user-id'];

  if (!userId || Array.isArray(userId)) {
    throw new AppError('Missing x-user-id header.', 401);
  }

  return userId;
}

interface ProjectParams {
  projectId: string;
}

interface FileParams extends ProjectParams {
  fileId: string;
}

interface CreateFileBody {
  name: string;
  content: string;
  parentId?: string | null;
  language?: string;
}

interface UpdateFileBody {
  content: string;
}

export async function createFileHandler(
  request: FastifyRequest<{ Params: ProjectParams; Body: CreateFileBody }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const file = await createFile({ ...request.body, projectId: request.params.projectId }, userId);

  reply.status(201).send(
    success({
      id: file.id,
      projectId: file.projectId,
      name: file.name,
      size: Buffer.byteLength(file.content, 'utf8'),
      createdAt: file.createdAt
    })
  );
}

export async function listFilesHandler(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply
): Promise<void> {
  const files = await listFiles(request.params.projectId);
  reply.send(
    success({
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: Buffer.byteLength(file.content, 'utf8'),
        lockedBy: file.lock?.userId ?? null,
        lockedAt: file.lock?.acquiredAt ?? null
      }))
    })
  );
}

export async function getFileHandler(
  request: FastifyRequest<{ Params: FileParams }>,
  reply: FastifyReply
): Promise<void> {
  const file = await getFile(request.params.projectId, request.params.fileId);

  reply.send(
    success({
      id: file.id,
      name: file.name,
      content: file.content,
      size: Buffer.byteLength(file.content, 'utf8'),
      lockedBy: file.lock?.userId ?? null,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    })
  );
}

export async function updateFileHandler(
  request: FastifyRequest<{ Params: FileParams; Body: UpdateFileBody }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const file = await updateFile(request.params.projectId, request.params.fileId, request.body.content, userId);

  reply.send(
    success({
      id: file.id,
      name: file.name,
      size: Buffer.byteLength(file.content, 'utf8'),
      updatedAt: file.updatedAt
    })
  );
}

export async function deleteFileHandler(
  request: FastifyRequest<{ Params: FileParams }>,
  reply: FastifyReply
): Promise<void> {
  await deleteFile(request.params.projectId, request.params.fileId);
  reply.send(success({ success: true }));
}

export async function acquireLockHandler(
  request: FastifyRequest<{ Params: FileParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const lock = await acquireLock(request.params.projectId, request.params.fileId, userId);

  reply.send(
    success({
      fileId: lock.fileId,
      lockedBy: lock.userId,
      lockedAt: lock.acquiredAt,
      expiresAt: lock.expiresAt
    })
  );
}

export async function releaseLockHandler(
  request: FastifyRequest<{ Params: FileParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  await releaseLock(request.params.projectId, request.params.fileId, userId);
  reply.send(success({ success: true }));
}

export async function renewLockHandler(
  request: FastifyRequest<{ Params: FileParams }>,
  reply: FastifyReply
): Promise<void> {
  const userId = getUserId(request);
  const expiresAt = await renewLock(request.params.projectId, request.params.fileId, userId);
  reply.send(success({ expiresAt }));
}
