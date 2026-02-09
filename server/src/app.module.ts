import { Module } from '@nestjs/common';
import { AcademicCareerModule } from './modules/academic-career/academic-career.module';

@Module({
  imports: [AcademicCareerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
