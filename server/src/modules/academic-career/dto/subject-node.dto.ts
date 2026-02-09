import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
// IMPORTAMOS DESDE NUESTRO ARCHIVO MANUAL
import { SubjectStatus } from '../../../common/constants/academic-enums'; 

export class SubjectNodeDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  planCode: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  semester: number;

  @ApiProperty()
  @IsNumber()
  credits: number;

  @ApiProperty()
  @IsBoolean()
  isOptional: boolean;

  @ApiProperty({ enum: SubjectStatus })
  @IsEnum(SubjectStatus)
  status: SubjectStatus;

  @ApiProperty({ required: false, nullable: true })
  @IsNumber()
  @IsOptional()
  grade: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  statusDate?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty()
  @IsArray()
  requiredSubjectIds: string[];

  constructor(partial: Partial<SubjectNodeDto>) {
    Object.assign(this, partial);
  }
}