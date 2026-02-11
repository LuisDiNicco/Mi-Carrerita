import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SubjectStatus } from '../../../common/constants/academic-enums';

export class UpdateSubjectRecordDto {
  @ApiProperty({ enum: SubjectStatus })
  @IsEnum(SubjectStatus)
  status: SubjectStatus;

  @ApiProperty({ required: false, nullable: true, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  grade?: number | null;

  @ApiProperty({ required: false, nullable: true, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  difficulty?: number | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'ISO date string (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  statusDate?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
