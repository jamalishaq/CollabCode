import { createHash } from 'node:crypto';

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { LOCK_TTL_SECONDS as DEFAULT_LOCK_TTL_SECONDS } from '@collabcode/shared-config';
import type { File as SharedFile, FileLock as SharedFileLock } from '@collabcode/shared-types';

import { config } from '../config';
import { r2Client } from '../config/storage';
import { producer } from '../events/producer';
import { prisma, type FileRecord } from '../lib/prisma';
import { redis } from '../lib/redis';
import { AppError } from '../utils/app-error';

const LOCK_PREFIX = 'file-lock';

interface CreateFileInput {
  projectId: string;
  name: string;
  content: string;
  parentId?: string | null;
  language?: string;
}

interface QstashProducer {
  publishJSON?: (args: unknown) => Promise<unknown>;
  publish?: (args: unknown) => Promise<unknown>;
}

function toSharedFile(file: FileRecord): SharedFile {
  return {
    id: file.id,
    projectId: file.projectId,
    parentId: file.parentId,
    name: file.name,
    path: file.path,
    language: file.language,
    content: file.content,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    deletedAt: file.deletedAt?.toISOString() ?? null
  };
}

function lockKey(fileId: string): string {
  return `${LOCK_PREFIX}:${fileId}`;
}

function objectKey(projectId: string, fileId: string): string {
  return `${projectId}/${fileId}`;
}

function parseLock(raw: string | null): SharedFileLock | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SharedFileLock;
  } catch {
    return null;
  }
}

async function publishLockConflict(payload: Record<string, unknown>): Promise<void> {
  const client = producer as unknown as QstashProducer;

  if (client.publishJSON) {
    await client.publishJSON({
      topic: 'file.lock.conflict',
      body: payload
    });
    return;
  }

  if (client.publish) {
    await client.publish({
      topic: 'file.lock.conflict',
      body: JSON.stringify(payload)
    });
  }
}

async function uploadFileContent(projectId: string, fileId: string, content: string): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: objectKey(projectId, fileId),
      Body: content,
      ContentType: 'text/plain; charset=utf-8'
    })
  );
}

async function downloadFileContent(projectId: string, fileId: string): Promise<string> {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: objectKey(projectId, fileId)
    })
  );

  if (!response.Body) {
    return '';
  }

  return response.Body.transformToString();
}

async function findActiveFile(projectId: string, fileId: string): Promise<FileRecord> {
  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId, deletedAt: null }
  });

  if (!file) {
    throw new AppError('File not found.', 404, 'FILE_NOT_FOUND');
  }

  return file;
}

export async function createFile(input: CreateFileInput, createdBy: string): Promise<SharedFile> {
  const file = await prisma.file.create({
    data: {
      projectId: input.projectId,
      parentId: input.parentId ?? null,
      name: input.name,
      path: input.name,
      language: input.language ?? 'plaintext',
      content: input.content
    }
  });

  await uploadFileContent(input.projectId, file.id, input.content);

  await prisma.fileVersion.create({
    data: {
      fileId: file.id,
      version: 1,
      contentHash: createHash('sha256').update(input.content).digest('hex'),
      createdBy
    }
  });

  return toSharedFile(file);
}

export async function listFiles(projectId: string): Promise<Array<SharedFile & { lock: SharedFileLock | null }>> {
  const files = await prisma.file.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: 'asc' }
  });

  return Promise.all(
    files.map(async (file) => ({
      ...toSharedFile(file),
      lock: parseLock(await redis.get(lockKey(file.id)))
    }))
  );
}

export async function getFile(projectId: string, fileId: string): Promise<SharedFile & { lock: SharedFileLock | null }> {
  const file = await findActiveFile(projectId, fileId);
  const blobContent = await downloadFileContent(projectId, file.id).catch(() => file.content);

  return {
    ...toSharedFile(file),
    content: blobContent,
    lock: parseLock(await redis.get(lockKey(file.id)))
  };
}

export async function updateFile(projectId: string, fileId: string, content: string, userId: string): Promise<SharedFile> {
  await findActiveFile(projectId, fileId);

  const lock = parseLock(await redis.get(lockKey(fileId)));
  if (!lock || lock.userId !== userId) {
    throw new AppError('You must hold the lock to update this file.', 409, 'LOCK_REQUIRED');
  }

  const latestVersion = await prisma.fileVersion.findFirst({
    where: { fileId },
    orderBy: { version: 'desc' }
  });

  await uploadFileContent(projectId, fileId, content);

  const updated = await prisma.file.update({
    where: { id: fileId },
    data: { content }
  });

  await prisma.fileVersion.create({
    data: {
      fileId,
      version: (latestVersion?.version ?? 0) + 1,
      contentHash: createHash('sha256').update(content).digest('hex'),
      createdBy: userId
    }
  });

  return toSharedFile(updated);
}

export async function deleteFile(projectId: string, fileId: string): Promise<void> {
  await findActiveFile(projectId, fileId);

  const lock = parseLock(await redis.get(lockKey(fileId)));
  if (lock) {
    throw new AppError('File is currently locked and cannot be deleted.', 409, 'FILE_LOCKED');
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: objectKey(projectId, fileId)
    })
  );

  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() }
  });
}

export async function acquireLock(projectId: string, fileId: string, userId: string): Promise<SharedFileLock> {
  const file = await findActiveFile(projectId, fileId);

  const now = new Date();
  const ttlSeconds = config.LOCK_TTL_SECONDS || DEFAULT_LOCK_TTL_SECONDS;
  const lock: SharedFileLock = {
    fileId,
    userId,
    acquiredAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString()
  };

  const result = await redis.set(lockKey(fileId), JSON.stringify(lock), 'EX', ttlSeconds, 'NX');
  if (result !== 'OK') {
    const currentLock = parseLock(await redis.get(lockKey(fileId)));

    try {
      await publishLockConflict({
        type: 'file.lock.conflict',
        fileId,
        fileName: file.name,
        requestedBy: userId,
        lockedBy: currentLock?.userId,
        expiresAt: currentLock?.expiresAt,
        timestamp: now.toISOString()
      });
    } catch {
      // Conflict responses should remain deterministic even if event publication fails.
    }

    throw new AppError('File is locked by another user', 409, 'FILE_LOCKED', {
      lockedBy: currentLock?.userId,
      expiresAt: currentLock?.expiresAt
    });
  }

  return lock;
}

export async function releaseLock(projectId: string, fileId: string, userId: string): Promise<void> {
  await findActiveFile(projectId, fileId);

  const releaseScript = `
    local value = redis.call('GET', KEYS[1])
    if not value then
      return 0
    end
    local obj = cjson.decode(value)
    if obj.userId ~= ARGV[1] then
      return -1
    end
    return redis.call('DEL', KEYS[1])
  `;

  const result = (await redis.eval(releaseScript, 1, lockKey(fileId), userId)) as number;

  if (result === 0) {
    throw new AppError('No active lock found.', 404, 'LOCK_NOT_FOUND');
  }

  if (result === -1) {
    throw new AppError('Only the lock holder can release the lock.', 403, 'LOCK_NOT_OWNER');
  }
}

export async function renewLock(projectId: string, fileId: string, userId: string): Promise<string> {
  await findActiveFile(projectId, fileId);

  const ttlSeconds = config.LOCK_TTL_SECONDS || DEFAULT_LOCK_TTL_SECONDS;
  const renewScript = `
    local value = redis.call('GET', KEYS[1])
    if not value then
      return cjson.encode({ status = 'NOT_FOUND' })
    end

    local obj = cjson.decode(value)
    if obj.userId ~= ARGV[1] then
      return cjson.encode({ status = 'NOT_OWNER' })
    end

    local acquiredAt = obj.acquiredAt
    local expiresAt = ARGV[2]
    local updated = cjson.encode({
      fileId = obj.fileId,
      userId = obj.userId,
      acquiredAt = acquiredAt,
      expiresAt = expiresAt
    })

    redis.call('SET', KEYS[1], updated, 'EX', tonumber(ARGV[3]))
    return cjson.encode({ status = 'OK', expiresAt = expiresAt })
  `;

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const raw = (await redis.eval(renewScript, 1, lockKey(fileId), userId, expiresAt, ttlSeconds)) as string;
  const result = JSON.parse(raw) as { status: 'OK' | 'NOT_FOUND' | 'NOT_OWNER'; expiresAt?: string };

  if (result.status === 'NOT_FOUND') {
    throw new AppError('No active lock found.', 404, 'LOCK_NOT_FOUND');
  }

  if (result.status === 'NOT_OWNER') {
    throw new AppError('Only the lock holder can renew the lock.', 403, 'LOCK_NOT_OWNER');
  }

  if (!result.expiresAt) {
    throw new AppError('Lock renew failed.', 500, 'LOCK_RENEW_FAILED');
  }

  return result.expiresAt;
}
