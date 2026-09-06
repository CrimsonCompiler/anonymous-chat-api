import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis-adapter/redis-io.adapter';

let cachedApp: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();

  // Redis Adapter for WebSockets
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const constraintKey = Object.keys(firstError.constraints || {})[0];
        const message =
          firstError.constraints?.[constraintKey] || 'Validation failed';

        const contexts = firstError.contexts || {};
        const code =
          (Object.values(contexts)[0] as any)?.errorCode || 'VALIDATION_ERROR';
        return new UnprocessableEntityException({
          success: false,
          error: {
            code: code,
            message: message,
          },
        });
      },
    }),
  );

  return app;
}

// 1. Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    const app = await bootstrap();
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp(req, res);
}

// 2. Standalone Server Listener (Local & Railway)
if (process.env.VERCEL !== '1') {
  bootstrap().then(async (app) => {
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
  });
}
