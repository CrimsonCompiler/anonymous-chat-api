import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis-adapter/redis-io.adapter';

let cachedServer: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();

  // সার্ভারলেস (Vercel) এনভায়রনমেন্টে লং-রানিং WebSocket অ্যাডাপ্টার ব্লক রাখা
  if (process.env.VERCEL !== '1') {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  }

  // কাস্টম গ্লোবাল ভ্যালিডেশন পাইপ
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

  await app.init();
  return app.getHttpAdapter().getInstance();
}

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
}

// Local Machine & Railway (Standalone Server Listener)
if (process.env.VERCEL !== '1') {
  (async () => {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api/v1');
    app.enableCors();

    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

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

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
  })();
}
