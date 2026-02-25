import { Module } from '@nestjs/common';
import { AcademicHistoryService } from './services/academic-history.service';
import { AcademicHistoryController } from './controllers/academic-history.controller';
import { AcademicHistoryPublicController } from './controllers/academic-history-public.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { EnvironmentAuthGuard } from '../../common/guards/environment-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfParserModule } from '../../shared/pdf-parser/pdf-parser.module';

@Module({
  imports: [PrismaModule, PdfParserModule],
  providers: [
    AcademicHistoryService,
    DevAuthGuard,
    JwtAuthGuard,
    EnvironmentAuthGuard,
  ],
  controllers: [AcademicHistoryController, AcademicHistoryPublicController],
  exports: [AcademicHistoryService],
})
export class AcademicHistoryModule { }
