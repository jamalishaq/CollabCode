import { Client } from '@upstash/qstash';

import { config } from '../config';

export const producer: Client = new Client({
  baseUrl: config.QSTASH_URL,
  token: config.QSTASH_TOKEN
});

export async function publishWorkspaceEvent(topic: string, body: Record<string, unknown>): Promise<void> {
  await producer.publishJSON({
    url: topic,
    body
  });
}
