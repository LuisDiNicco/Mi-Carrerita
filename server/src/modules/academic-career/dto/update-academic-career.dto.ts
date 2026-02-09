import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicCareerDto } from './create-academic-career.dto';

export class UpdateAcademicCareerDto extends PartialType(CreateAcademicCareerDto) {}
