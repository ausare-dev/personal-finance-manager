import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { App } from 'supertest/types';

/**
 * Creates an Nest application for E2E tests with the same pipes as production (ValidationPipe).
 * Swagger and CORS are skipped for E2E.
 * Use with supertest: request(app.getHttpServer()).
 */
export async function createTestApp(): Promise<INestApplication<App>> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
}
