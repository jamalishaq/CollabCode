import { Client } from '@upstash/qstash';

import { config } from '../config';

/** Shared QStash producer for outbound events. */
export const producer: Client = new Client({
  token: config.QSTASH_TOKEN
});
