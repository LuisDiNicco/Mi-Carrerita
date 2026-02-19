import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { SubjectStatus } from '../../../common/constants/academic-enums';

/**
 * Academic History DTOs
 * For querying, filtering, editing, and deleting academic records
 */

/** Filter options for academic history datatable */
export class AcademicHistoryFilterDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string; // ISO date string

  @IsOptional()
  @IsDateString()
  dateTo?: string; // ISO date string

  @IsOptional()
  @IsNumber()
  gradeMin?: number;

  @IsOptional()
  @IsNumber()
  gradeMax?: number;

  @IsOptional()
  @IsString()
  planCode?: string; // Filter by subject code

  @IsOptional()
  @IsNumber()
  year?: number; // Filter by subject year

  @IsOptional()
  @IsNumber()
  semester?: number; // Filter by semester (1 or 2)

  @IsOptional()
  @IsString()
  status?: string; // SubjectStatus value

  @IsOptional()
  @IsBoolean()
  isIntermediate?: boolean; // Filter by intermediate vs final

  @IsOptional()
  @IsString()
  sortBy?: 'date' | 'grade' | 'code' | 'status'; // Sort field (default: date DESC)

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number; // Pagination (default: 1)

  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number; // Limit per page (default: 50)
}

/** Edit academic record payload */
export class EditAcademicRecordDto {
  @IsString()
  status: string; // SubjectStatus value

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  finalGrade?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  difficulty?: number; // User-perceived difficulty

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isIntermediate?: boolean;

  @IsOptional()
  @IsDateString()
  statusDate?: string; // ISO date
}

/** Single row in academic history table */
export interface AcademicHistoryRowDto {
  id: string;
  subjectId: string;
  subjectName: string;
  planCode: string;
  year: number;
  semester: number; // 1 or 2 (inferred)
  hours: number;
  status: string; // SubjectStatus value
  finalGrade: number | null;
  difficulty: number | null; // 1-10
  notes: string | null;
  statusDate: string | null; // ISO date
  isIntermediate: boolean;
}

/** Paginated result of academic history query */
export interface AcademicHistoryPageDto {
  data: AcademicHistoryRowDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
