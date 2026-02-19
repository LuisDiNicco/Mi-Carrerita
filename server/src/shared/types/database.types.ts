/**
 * Shared Database Types
 * Reusable types for common Prisma queries with relations
 */

import {
  AcademicRecord,
  Subject,
  User,
  Timetable,
  RecommendedSubject,
  Trophy,
  UserTrophy,
} from '@prisma/client';

/**
 * AcademicRecord with Subject details
 * Used in dashboard, academic-history, and trophy modules
 */
export interface AcademicRecordWithSubject extends AcademicRecord {
  subject: {
    id: string;
    planCode: string;
    name: string;
    year: number;
    hours: number;
    isOptional: boolean;
  };
}

/**
 * Timetable with Subject details
 * Used in schedule module for conflict detection and display
 */
export interface TimetableWithSubject extends Timetable {
  subject: {
    id: string;
    planCode: string;
    name: string;
    year: number;
    hours: number;
    isOptional: boolean;
  };
}

/**
 * RecommendedSubject with Subject details
 * Used in schedule module for recommendations
 */
export interface RecommendedSubjectWithSubject extends RecommendedSubject {
  subject: {
    id: string;
    planCode: string;
    name: string;
    year: number;
    hours: number;
    isOptional: boolean;
  };
}

/**
 * Trophy with UserTrophy details
 * Used in trophy module for trophy case display
 */
export interface TrophyWithUnlock extends Trophy {
  userTrophies?: Array<{
    id: string;
    userId: string;
    unlockedAt: Date | null;
    progress: number;
    metadata: string | null;
  }>;
}

/**
 * UserTrophy with Trophy details
 * Used in trophy module for user trophy display
 */
export interface UserTrophyWithDetails extends UserTrophy {
  trophy: Trophy;
}
