import { Kafka, type Consumer } from 'kafkajs';

import { config } from '../config';

/** Shared Kafka consumer for inbound events. */
export const consumer: Consumer = new Kafka({
  clientId: 'file-service',
  brokers: config.KAFKA_BROKERS.split(',')
}).consumer({ groupId: 'file-service-group' });
