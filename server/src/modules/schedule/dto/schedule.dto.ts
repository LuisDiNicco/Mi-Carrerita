import { IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { TimePeriod } from '../../../common/constants/schedule-enums';

/**
 * Schedule & Recommendation DTOs
 * For managing timetables and generating conflict-free recommendations
 */

/** Create or update a timetable entry for a subject */
export class CreateTimetableDto {
  @IsString()
  subjectId: string;

  @IsEnum(TimePeriod)
  period: TimePeriod; // 'AM', 'PM', 'EVENING'

  @IsNumber()
  @Min(1)
  @Max(6)
  dayOfWeek: number; // 1=Mon, 6=Sat
}

/** Set multiple timetable entries at once (bulk) */
export class SetTimetableDto {
  timetables: CreateTimetableDto[];
}

/** Update recommendation status (suggest → mantenida → delete) */
export class UpdateRecommendationStatusDto {
  @IsString()
  subjectId: string;

  @IsString()
  status: 'SUGGESTED' | 'MANTENIDA' | 'DELETED';

  // DTO para timetable si status es 'MANTENIDA'
  timetable?: CreateTimetableDto;
}

/** Timetable entry response */
export interface TimetableDto {
  id: string;
  subjectId: string;
  subjectName: string;
  planCode: string;
  period: string; // 'AM', 'PM', 'EVENING' - stored as string in DB
  dayOfWeek: number;
  dayLabel: string; // 'Lunes', 'Martes', etc.
}

/** Conflict between two subjects */
export interface ConflictDto {
  subject1Id: string;
  subject1Name: string;
  subject2Id: string;
  subject2Name: string;
  period: string; // 'AM', 'PM', 'EVENING' - stored as string in DB
  dayOfWeek: number;
  dayLabel: string;
}

/** A single recommended subject */
export interface RecommendedSubjectDto {
  id: string;
  subjectId: string;
  subjectName: string;
  planCode: string;
  year: number;
  hours: number;
  status: 'SUGGESTED' | 'MANTENIDA' | 'DELETED';
  timetables?: TimetableDto[];
}

/** Result of recommendation generation or check */
export interface RecommendationResultDto {
  recommendedSubjects: RecommendedSubjectDto[];
  conflicts: ConflictDto[]; // empty if no conflicts
  hasConflicts: boolean;
}
