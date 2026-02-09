// server/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <--- Importar

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- CONFIGURACIÓN DE SWAGGER (DOCUMENTACIÓN) ---
  const config = new DocumentBuilder()
    .setTitle('Mi Carrerita API')
    .setDescription('API para gestión de correlatividades y seguimiento académico')
    .setVersion('1.0')
    .addTag('Academic Career')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // La docs estarán en /api/docs
  // ------------------------------------------------

  await app.listen(3000);
}
bootstrap();