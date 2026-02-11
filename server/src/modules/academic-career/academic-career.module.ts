import { Logger, Module } from '@nestjs/common';
import { AcademicCareerService } from './services/academic-career.service';
import { AcademicCareerController } from './controllers/academic-career.controller';

@Module({
  controllers: [AcademicCareerController],
  providers: [AcademicCareerService, Logger],
})
export class AcademicCareerModule {}
