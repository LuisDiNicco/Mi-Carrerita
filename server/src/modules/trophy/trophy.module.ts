import { Module, Logger } from '@nestjs/common';
import { TrophyService } from './services/trophy.service';
import { TrophyController } from './controllers/trophy.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { EnvironmentAuthGuard } from '../../common/guards/environment-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    TrophyService,
    Logger,
    DevAuthGuard,
    JwtAuthGuard,
    EnvironmentAuthGuard,
  ],
  controllers: [TrophyController],
  exports: [TrophyService],
})
export class TrophyModule {}
