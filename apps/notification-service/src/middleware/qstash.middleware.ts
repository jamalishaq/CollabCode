import { failure } from '@collabcode/shared-utils';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';

import { consumer } from '../events/consumer';

interface QstashReceiver {
  verify: (options: { signature: string; body: string; url?: string }) => Promise<unknown>;
}

function resolveSignatureHeader(request: FastifyRequest): string | null {
  const candidate = request.headers['upstash-signature'] ?? request.headers['Upstash-Signature'];

  if (Array.isArray(candidate)) {
    return candidate[0] ?? null;
  }

  return candidate ?? null;
}

function resolveAbsoluteUrl(request: FastifyRequest): string {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const forwardedHost = request.headers['x-forwarded-host'];

  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto ?? request.protocol ?? 'http';

  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost ?? request.headers.host;

  if (!host) {
    return request.url;
  }

  return `${protocol}://${host}${request.url}`;
}

function resolveRawBody(request: FastifyRequest): string {
  const rawBody = (request as { rawBody?: string }).rawBody;

  if (typeof rawBody === 'string') {
    return rawBody;
  }

  if (typeof request.body === 'string') {
    return request.body;
  }

  return JSON.stringify(request.body ?? {});
}

export const qstashMiddleware: preHandlerHookHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const signature = resolveSignatureHeader(request);

  if (!signature) {
    reply.status(401).send(failure('QSTASH_SIGNATURE_MISSING', 'Missing Upstash signature header.'));
    return;
  }

  try {
    await (consumer as unknown as QstashReceiver).verify({
      signature,
      body: resolveRawBody(request),
      url: resolveAbsoluteUrl(request)
    });
  } catch (error) {
    request.log.warn({ err: error }, 'QStash signature verification failed.');
    reply.status(401).send(failure('QSTASH_SIGNATURE_INVALID', 'Invalid QStash signature.'));
  }
};
