import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis-adapter/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  // redisAdapter
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
