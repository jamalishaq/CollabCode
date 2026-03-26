import type { FastifyInstance } from 'fastify';

import {
  executionCompletedHandler,
  lockConflictHandler,
  memberInvitedHandler,
  workspaceCreatedHandler
} from '../controllers/notification.controller';
import { qstashMiddleware } from '../middleware/qstash.middleware';
import { validateMiddleware } from '../middleware/validate.middleware';
import {
  executionCompletedSchema,
  lockConflictSchema,
  memberInvitedSchema,
  workspaceCreatedSchema
} from '../schemas/notification.schema';

export async function notificationRoute(app: FastifyInstance): Promise<void> {
  app.post(
    '/notifications/member-invited',
    { preHandler: [qstashMiddleware, validateMiddleware(memberInvitedSchema)] },
    memberInvitedHandler
  );

  app.post(
    '/notifications/workspace-created',
    { preHandler: [qstashMiddleware, validateMiddleware(workspaceCreatedSchema)] },
    workspaceCreatedHandler
  );

  app.post(
    '/notifications/lock-conflict',
    { preHandler: [qstashMiddleware, validateMiddleware(lockConflictSchema)] },
    lockConflictHandler
  );

  app.post(
    '/notifications/execution-completed',
    { preHandler: [qstashMiddleware, validateMiddleware(executionCompletedSchema)] },
    executionCompletedHandler
  );
}
