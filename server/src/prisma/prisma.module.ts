// server/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <--- IMPORTANTE: Hace que PrismaService esté disponible en TODA la app sin importarlo mil veces
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
