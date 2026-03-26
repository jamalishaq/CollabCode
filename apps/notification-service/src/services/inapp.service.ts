import type { FastifyBaseLogger } from 'fastify';

interface InAppNotification {
  userId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface InAppService {
  send: (payload: InAppNotification) => Promise<void>;
}

export function createInAppService(logger: FastifyBaseLogger): InAppService {
  return {
    async send(payload: InAppNotification): Promise<void> {
      logger.info(
        {
          event: 'notification.inapp.sent',
          userId: payload.userId,
          title: payload.title,
          metadata: payload.metadata
        },
        payload.message
      );
    }
  };
}
