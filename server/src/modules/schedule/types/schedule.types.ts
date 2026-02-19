/**
 * Internal types for Schedule & Recommendation computation
 * Not exposed in DTOs, used for service calculations
 */

import { TimePeriod } from '../../../common/constants/schedule-enums';

/** Internal timetable entry (from DB) */
export interface TimetableEntry {
  id: string;
  userId: string;
  subjectId: string;
  period: string; // 'AM', 'PM', 'EVENING' - stored as string in Prisma
  dayOfWeek: number;
}

/** Enriched timetable with subject info */
export interface EnrichedTimetable extends TimetableEntry {
  subjectName: string;
  planCode: string;
}

/** Pair of conflicting timetables */
export interface ConflictPair {
  timetable1: EnrichedTimetable;
  timetable2: EnrichedTimetable;
}

/** Recommendation state (from DB) */
export interface RecommendationRecord {
  id: string;
  userId: string;
  subjectId: string;
  status: 'SUGGESTED' | 'MANTENIDA' | 'DELETED';
  recommendedAt: Date;
  takenAt: Date | null;
}

/** Subject with all required info for recommendation display */
export interface RecommendableSubject {
  id: string;
  planCode: string;
  name: string;
  year: number;
  hours: number;
  recommendation?: RecommendationRecord;
  timetables?: TimetableEntry[];
}
