import { Module } from '@nestjs/common';
import { AcademicCareerService } from './academic-career.service';
import { AcademicCareerController } from './academic-career.controller';

@Module({
  controllers: [AcademicCareerController],
  providers: [AcademicCareerService],
})
export class AcademicCareerModule {}
