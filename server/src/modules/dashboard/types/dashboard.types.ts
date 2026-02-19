/**
 * Internal types for Dashboard computation
 * Not exposed in DTOs, used for service calculations
 */

import { SubjectStatus } from '../../../common/constants/academic-enums';

/** Subject record with computed year/semester info */
export interface SubjectWithYearInfo {
  id: string;
  planCode: string;
  name: string;
  year: number;
  hours: number;
  isOptional: boolean;
  status: SubjectStatus;
  finalGrade: number | null;
  difficulty: number | null;
  statusDate: Date | null;
}

/** Grouped subjects by semester */
export interface SubjectsBySemester {
  year: number;
  semester: number;
  subjects: SubjectWithYearInfo[];
}

/** Computed semester statistics */
export interface SemesterStats {
  year: number;
  semester: number;
  totalSubjects: number;
  passedCount: number;
  totalHours: number;
  completedHours: number;
  grades: (number | null)[];
}
