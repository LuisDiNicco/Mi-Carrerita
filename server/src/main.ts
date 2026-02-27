// server/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // <--- Importar
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { Request, Response } from 'express';

async function ensureDevDatabase() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  let projectRoot = path.resolve(process.cwd());
  let schemaPath = path.resolve(projectRoot, 'prisma', 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    projectRoot = path.resolve(__dirname, '..');
    schemaPath = path.resolve(projectRoot, 'prisma', 'schema.prisma');
  }

  const autoReset = process.env.AUTO_DB_RESET !== 'false';

  if (autoReset) {
    execSync(
      `npx prisma migrate reset --force --skip-generate --schema "${schemaPath}"`,
      {
        stdio: 'inherit',
        cwd: projectRoot,
      },
    );
  } else {
    execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });
  }

  try {
    execSync(`npx prisma db seed --schema "${schemaPath}"`, {
      stdio: 'inherit',
      cwd: projectRoot,
    });
  } catch {
    // Seeding is optional for dev; ignore failures.
  }
}

async function bootstrap() {
  await ensureDevDatabase();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  const clientUrl = configService.getOrThrow<string>('CLIENT_URL');
  app.use(helmet());
  app.enableCors({
    origin: clientUrl,
    credentials: true,
  });

  app.use(cookieParser());

  app.use('/socket.io', (_req: Request, res: Response) => {
    res.status(204).end();
  });

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
