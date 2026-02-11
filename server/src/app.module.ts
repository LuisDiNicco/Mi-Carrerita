// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module'; // <--- Importar archivo
import { AcademicCareerModule } from './modules/academic-career/academic-career.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule, // <--- Agregar al array de imports
    AcademicCareerModule,
    AuthModule,
  ],
})
export class AppModule {}
