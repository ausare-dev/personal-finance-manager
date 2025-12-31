import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3001',
  );

  // CORS configuration
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
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

  // Winston logger (if configured)
  try {
    const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    app.useLogger(winstonLogger);
  } catch (error) {
    // Winston not configured, using default logger
  }

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Personal Finance Manager API')
    .setDescription('API для управления личными финансами')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Аутентификация и авторизация')
    .addTag('Wallets', 'Управление кошельками')
    .addTag('Transactions', 'Управление транзакциями')
    .addTag('Budgets', 'Управление бюджетами')
    .addTag('Goals', 'Управление финансовыми целями')
    .addTag('Investments', 'Управление инвестициями')
    .addTag('Currencies', 'Курсы валют')
    .addTag('Analytics', 'Аналитика и статистика')
    .addTag('Import/Export', 'Импорт и экспорт данных')
    .addTag('Education', 'Образовательные материалы')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`CORS enabled for: ${frontendUrl}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();
