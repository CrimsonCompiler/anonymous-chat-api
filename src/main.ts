import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const message =
          Object.values(firstError.constraints || {})[0] || 'Validation failed';
        return new BadRequestException({
          error: {
            code: 'VALIDATION_ERROR',
            message: message,
          },
        });
      },
    }),
  );
}
bootstrap();
