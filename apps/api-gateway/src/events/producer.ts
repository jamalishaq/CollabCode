import { Kafka, type Producer } from 'kafkajs';

import { config } from '../config';

/** Shared Kafka producer for outbound events. */
export const producer: Producer = new Kafka({
  clientId: 'api-gateway',
  brokers: config.KAFKA_BROKERS.split(',')
}).producer();
