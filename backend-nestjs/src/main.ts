import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);
  const prefix = config.get<string>('app.prefix', 'api/v1');
  const corsOrigin = config.get<string>(
    'app.corsOrigin',
    'http://localhost:5173',
  );
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');

  app.setGlobalPrefix(prefix);
  const origins = corsOrigin.split(',').map((o) => o.trim());
  app.enableCors({ origin: origins, credentials: true });

  const uploadDir = config.get<string>('app.uploadDir')!;
  await mkdir(join(uploadDir, 'products'), { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors) => {
        const details = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
        }));
        return new UnprocessableEntityException({
          code: 'VALIDATION_001',
          message: 'Validation failed',
          details,
        });
      },
    }),
  );
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  if (nodeEnv === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Ecommerce Shop API')
      .setDescription('API documentation for the e-commerce platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document);
  }

  await app.listen(port);

  console.log('CORS_ORIGIN =', corsOrigin);
  const logger = new Logger('Bootstrap');
  logger.log(`Application running on http://localhost:${port}/${prefix}`);
  logger.log(`Environment: ${nodeEnv}`);
  if (nodeEnv === 'development') {
    logger.log(`Swagger docs: http://localhost:${port}/${prefix}/docs`);
  }
}
bootstrap();
