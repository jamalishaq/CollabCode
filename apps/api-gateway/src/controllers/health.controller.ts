import type { FastifyReply, FastifyRequest } from 'fastify';

import { success } from '@collabcode/shared-utils';

/** Health endpoint controller. */
export class HealthController {
  static check(_request: FastifyRequest, reply: FastifyReply): void {
    reply.status(200).send(
      success({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        service: 'api-gateway'
      })
    );
  }
}
