import { Module, Logger } from '@nestjs/common';
import { ScheduleService } from './services/schedule.service';
import { RecommendationService } from './services/recommendation.service';
import { ScheduleController } from './controllers/schedule.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { EnvironmentAuthGuard } from '../../common/guards/environment-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfParserModule } from '../../shared/pdf-parser/pdf-parser.module';

@Module({
  imports: [PrismaModule, PdfParserModule],
  providers: [
    ScheduleService,
    RecommendationService,
    Logger,
    DevAuthGuard,
    JwtAuthGuard,
    EnvironmentAuthGuard,
  ],
  controllers: [ScheduleController],
  exports: [ScheduleService, RecommendationService],
})
export class ScheduleModule { }
