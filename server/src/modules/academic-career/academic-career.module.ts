import { Logger, Module } from '@nestjs/common';
import { AcademicCareerService } from './services/academic-career.service';
import { AcademicCareerController } from './controllers/academic-career.controller';
import { AcademicCareerPublicController } from './controllers/academic-career-public.controller';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { EnvironmentAuthGuard } from '../../common/guards/environment-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  controllers: [AcademicCareerController, AcademicCareerPublicController],
  providers: [
    AcademicCareerService,
    Logger,
    DevAuthGuard,
    JwtAuthGuard,
    EnvironmentAuthGuard,
  ],
})
export class AcademicCareerModule {}
