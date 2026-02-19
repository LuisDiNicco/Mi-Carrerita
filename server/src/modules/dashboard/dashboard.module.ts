import { Module, Logger } from '@nestjs/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { EnvironmentAuthGuard } from '../../common/guards/environment-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    DashboardService,
    Logger,
    DevAuthGuard,
    JwtAuthGuard,
    EnvironmentAuthGuard,
  ],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
