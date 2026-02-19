/**
 * Internal types for Academic History computation
 * Not exposed in DTOs, used for service calculations
 */

import { SubjectStatus } from '../../../common/constants/academic-enums';

/** Domain model for academic record with full subject info */
export interface AcademicRecordWithSubject {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  planCode: string;
  year: number;
  hours: number;
  status: SubjectStatus;
  finalGrade: number | null;
  difficulty: number | null; // 1-10
  notes: string | null;
  statusDate: Date | null;
  isIntermediate: boolean;
  updatedAt: Date;
}

/** Sort direction for pagination */
export type SortDirection = 'asc' | 'desc';

/** Query builder state */
export interface QueryState {
  filters: Map<string, any>;
  sortBy: string;
  sortDir: SortDirection;
  page: number;
  limit: number;
  offset: number;
}
