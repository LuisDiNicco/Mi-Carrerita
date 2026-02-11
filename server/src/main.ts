// server/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <--- Importar
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
  app.enableCors({
    origin: clientUrl,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // --- CONFIGURACIÓN DE SWAGGER (DOCUMENTACIÓN) ---
  const config = new DocumentBuilder()
    .setTitle('Mi Carrerita API')
    .setDescription(
      'API para gestión de correlatividades y seguimiento académico',
    )
    .setVersion('1.0')
    .addTag('Academic Career')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // La docs estarán en /api/docs
  // ------------------------------------------------

  await app.listen(3000);
  logger.log('Application is running on: ' + (await app.getUrl()));
}
bootstrap();
