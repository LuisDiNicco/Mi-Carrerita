/**
 * Schedule conflict detection helpers
 */

import { ConflictDto } from '../dto';
import {
  DAY_LABELS,
  PERIOD_LABELS,
  TimePeriod,
} from '../../../common/constants/schedule-enums';

/** Internal timetable entry for conflict checking */
export interface TimetableCheck {
  subjectId: string;
  subjectName: string;
  planCode: string;
  period: string; // Stored in DB as string ('AM', 'PM', 'EVENING')
  dayOfWeek: number;
}

/**
 * Detect conflicts between timetable entries
 * Returns array of conflicting pairs
 */
export function detectConflicts(timetables: TimetableCheck[]): ConflictDto[] {
  const conflicts: ConflictDto[] = [];

  // Compare each pair of timetables
  for (let i = 0; i < timetables.length; i++) {
    for (let j = i + 1; j < timetables.length; j++) {
      const t1 = timetables[i];
      const t2 = timetables[j];

      // Conflict if same day AND same period
      if (t1.dayOfWeek === t2.dayOfWeek && t1.period === t2.period) {
        conflicts.push({
          subject1Id: t1.subjectId,
          subject1Name: t1.subjectName,
          subject2Id: t2.subjectId,
          subject2Name: t2.subjectName,
          period: t1.period,
          dayOfWeek: t1.dayOfWeek,
          dayLabel: DAY_LABELS[t1.dayOfWeek] || `Day ${t1.dayOfWeek}`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Check if adding a new timetable to existing ones creates conflicts
 */
export function checkNewTimetableConflicts(
  existingTimetables: TimetableCheck[],
  newTimetable: TimetableCheck,
): ConflictDto[] {
  const allTimetables = [...existingTimetables, newTimetable];
  return detectConflicts(allTimetables);
}

/**
 * Check if a timetable entry is valid
 */
export function isValidTimetable(timetable: TimetableCheck): {
  valid: boolean;
  error?: string;
} {
  if (!timetable.subjectId) {
    return { valid: false, error: 'Subject ID is required' };
  }

  if (timetable.dayOfWeek < 1 || timetable.dayOfWeek > 6) {
    return { valid: false, error: 'Day of week must be 1-6 (Mon-Sat)' };
  }

  const validPeriods = Object.values(TimePeriod) as string[];
  if (!validPeriods.includes(timetable.period)) {
    return {
      valid: false,
      error: `Period must be one of: ${validPeriods.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Group timetables by subject
 */
export function groupTimetablesBySubject(
  timetables: TimetableCheck[],
): Map<string, TimetableCheck[]> {
  const grouped = new Map<string, TimetableCheck[]>();

  timetables.forEach((t) => {
    if (!grouped.has(t.subjectId)) {
      grouped.set(t.subjectId, []);
    }
    grouped.get(t.subjectId)!.push(t);
  });

  return grouped;
}

/**
 * Get human-readable summary of a timetable
 */
export function formatTimetableSummary(timetables: TimetableCheck[]): string[] {
  return timetables.map((t) => {
    const day = DAY_LABELS[t.dayOfWeek] || `Day ${t.dayOfWeek}`;
    const period = PERIOD_LABELS[t.period as TimePeriod] || t.period;
    return `${t.subjectName} (${day}, ${period})`;
  });
}
