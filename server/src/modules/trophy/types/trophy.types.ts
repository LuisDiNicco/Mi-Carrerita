/**
 * Internal types for Trophy System computation
 * Not exposed in DTOs, used for service unlock logic
 */

import { Prisma } from '@prisma/client';
import { TrophyTier } from '../../../common/constants/trophy-enums';

export type AcademicRecordWithSubject = Prisma.AcademicRecordGetPayload<{
  include: { subject: true };
}>;

/** Trophy unlock criteria evaluator */
export interface TrophyCriteria {
  code: string;
  evaluate: (context: TrophyEvaluationContext) => Promise<boolean> | boolean;
}

/** Context passed to evaluation functions */
export interface TrophyEvaluationContext {
  userId: string;
  userEmail: string;
  totalSubjects: number;
  completedSubjects: number;
  totalHours: number;
  completedHours: number;
  grades: (number | null)[];
  hasIntermediateDegree: boolean;
  subjectRecords: AcademicRecordWithSubject[];
  trophyProgress?: number; // Current progress 0-100
}

/** Trophy metadata variants */
export type TrophyMetadata =
  | { type: 'simple' }
  | { type: 'grade_threshold'; threshold: number }
  | { type: 'streak'; count: number }
  | { type: 'subject_list'; subjects: string[] }
  | { type: 'custom'; data: Record<string, unknown> };

/** Internal trophy state */
export interface InternalTrophyState {
  userId: string;
  trophyId: string;
  code: string;
  unlocked: boolean;
  unlockedAt: Date | null;
  progress: number; // 0-100
  metadata?: TrophyMetadata;
  lastChecked: Date;
}

/** Trophy seed definition (for initialization) */
export interface TrophySeedDefinition {
  code: string;
  name: string;
  description: string;
  tier: TrophyTier;
  icon: string; // URL
  rarity: number; // 1-100
  criteria?: string; // Description
}
