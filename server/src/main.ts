// server/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import { Request, Response } from 'express';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      level: isProd ? 'info' : 'debug',
      format: isProd
        ? winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
        : winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.cli()
        ),
      transports: [
        new winston.transports.Console()
      ],
    }),
  });

  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Render (y otros proveedores cloud) terminan SSL en su load balancer y
  // reenvían tráfico como HTTP interno. Sin esto, Express no confía en
  // X-Forwarded-Proto y req.secure = false, lo que puede afectar cookies Secure.
  if (isProd) {
    app.set('trust proxy', 1);
  }

  const clientUrl = configService.getOrThrow<string>('CLIENT_URL');
  app.use(helmet());
  app.enableCors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
  app.useGlobalInterceptors(new LoggingInterceptor());

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
