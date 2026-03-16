import { Receiver } from '@upstash/qstash';

import { config } from '../config';

/** Shared QStash consumer for inbound events. */
export const consumer: Receiver = new Receiver({
  currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
})
