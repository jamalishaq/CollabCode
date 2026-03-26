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

export const qstashMiddleware: preHandlerHookHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const signature = resolveSignatureHeader(request);

  if (!signature) {
    reply.status(401).send(failure('QSTASH_SIGNATURE_MISSING', 'Missing Upstash signature header.'));
    return;
  }

  const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});

  try {
    await (consumer as unknown as QstashReceiver).verify({
      signature,
      body,
      url: request.url
    });
  } catch (error) {
    request.log.warn({ err: error }, 'QStash signature verification failed.');
    reply.status(401).send(failure('QSTASH_SIGNATURE_INVALID', 'Invalid QStash signature.'));
  }
};
