// server/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module'; // <--- Importar archivo
import { AcademicCareerModule } from './modules/academic-career/academic-career.module';

@Module({
  imports: [
    PrismaModule, // <--- Agregar al array de imports
    AcademicCareerModule
  ],
})
export class AppModule {}