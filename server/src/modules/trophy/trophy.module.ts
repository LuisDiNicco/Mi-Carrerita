import { Module, Logger } from '@nestjs/common';
import { TrophyService } from './services/trophy.service';
import { TrophyController } from './controllers/trophy.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  AverageEvaluator,
  CompletionEvaluator,
  HoursEvaluator,
  ConsistencyEvaluator,
  ChallengeEvaluator,
  CountEvaluator,
} from './evaluators';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { EnvironmentAuthGuard } from '../../common/guards/environment-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    TrophyService,
    AverageEvaluator,
    CompletionEvaluator,
    HoursEvaluator,
    ConsistencyEvaluator,
    ChallengeEvaluator,
    CountEvaluator,
    Logger,
    DevAuthGuard,
    JwtAuthGuard,
    EnvironmentAuthGuard,
  ],
  controllers: [TrophyController],
  exports: [TrophyService],
})
export class TrophyModule { }
