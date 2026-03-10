import { createApp } from './app';
import { config } from './config';

async function bootstrap(): Promise<void> {
  const app = createApp();
  await app.listen({ host: '0.0.0.0', port: config.PORT });
}

void bootstrap();
