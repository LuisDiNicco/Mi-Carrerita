// server/src/common/docs/swagger.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Mi Carrerita API')
    .setDescription('API para rastrear y optimizar tu carrera universitaria')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT token obtenido de /auth/login o /auth/google/callback',
      },
      'JWT',
    )
    .addCookieAuth(
      'refreshToken',
      {
        type: 'apiKey',
        in: 'cookie',
        description: 'Refresh token almacenado en httpOnly cookie',
      },
      'refreshToken',
    )
    .addServer('http://localhost:3000', 'Desarrollo local')
    .addServer('https://api.carrerita.com', 'Producción')
    .addTag('Auth', 'Autenticación con Google OAuth y JWT')
    .addTag('Academic Career', 'Gestión de carrera académica')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayOperationId: true,
    },
    customCss: `
      .topbar { display: none; }
      .swagger-ui { padding: 20px; }
    `,
  });

  console.log(
    '📚 Swagger documentation available at http://localhost:3000/api/docs',
  );
}
