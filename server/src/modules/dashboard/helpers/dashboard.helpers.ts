/**
 * Dashboard computation helpers
 * Utility functions for calculating metrics and aggregations
 */

import { SubjectStatus } from '../../../common/constants/academic-enums';
import {
  SemesterDataPoint,
  DifficultyScatterPoint,
  BurnUpPoint,
  SubjectRankingDto,
} from '../dto';
import { AcademicRecordWithSubject } from '../../../shared/types/database.types';

/** Group subjects by semester (year + inferred semester) */
export function groupBySemester(
  records: AcademicRecordWithSubject[],
): Map<string, AcademicRecordWithSubject[]> {
  const grouped = new Map<string, AcademicRecordWithSubject[]>();

  records.forEach((record) => {
    // Semester inference: first half of year = sem 1, second half = sem 2
    // Alternatively, use statusDate if available and reliable
    const semester = inferSemesterFromDateOrDefault(
      record.statusDate,
      record.subject.year,
    );
    const key = `${record.subject.year}-${semester}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(record);
  });

  return grouped;
}

/** Infer semester from date or return default based on year */
function inferSemesterFromDateOrDefault(
  statusDate: Date | null,
  year: number,
): number {
  if (!statusDate) return 1; // Default to semester 1 if no date

  const month = statusDate.getMonth() + 1; // 1-12
  // Assumption: First semester = Jan-Jun (months 1-6), Second = Jul-Dec (months 7-12)
  return month <= 6 ? 1 : 2;
}

/** Calculate average grade from array of grades */
export function calculateAverage(grades: (number | null)[]): number | null {
  const validGrades = grades.filter((g) => g !== null);
  if (validGrades.length === 0) return null;
  return (
    Math.round(
      (validGrades.reduce((a, b) => a + b, 0) / validGrades.length) * 100,
    ) / 100
  );
}

/** Calculate success percentage from array of statuses */
export function calculateSuccessPercentage(statuses: string[]): number {
  if (statuses.length === 0) return 0;
  const passedCount = statuses.filter((s) =>
    [SubjectStatus.APROBADA, SubjectStatus.REGULARIZADA].includes(
      s as SubjectStatus,
    ),
  ).length;
  return Math.round((passedCount / statuses.length) * 100 * 100) / 100;
}

/** Check if a subject is considered "passed" */
export function isSubjectPassed(status: string): boolean {
  return [SubjectStatus.APROBADA, SubjectStatus.REGULARIZADA].includes(
    status as SubjectStatus,
  );
}

/** Calculate completed hours (only for passed subjects) */
export function calculateCompletedHours(
  records: AcademicRecordWithSubject[],
): number {
  return records
    .filter((r) => isSubjectPassed(r.status))
    .reduce((sum, r) => sum + (r.subject.hours || 0), 0);
}

/** Calculate total hours */
export function calculateTotalHours(
  records: AcademicRecordWithSubject[],
): number {
  return records.reduce((sum, r) => sum + (r.subject.hours || 0), 0);
}

/** Build SemesterDataPoint from grouped records */
export function buildSemesterDataPoint(
  year: number,
  semester: number,
  records: AcademicRecordWithSubject[],
): SemesterDataPoint {
  const grades = records
    .filter((r) => r.finalGrade !== null && isSubjectPassed(r.status))
    .map((r) => r.finalGrade);

  const statuses = records.map((r) => r.status);
  const totalHours = calculateTotalHours(records);
  const completedHours = calculateCompletedHours(records);

  return {
    year,
    semester,
    label: `${year} Q${semester}`, // e.g., "2024 Q1"
    avgGrade: calculateAverage(grades),
    successPercentage: calculateSuccessPercentage(statuses),
    totalHours,
    completedHours,
    subjectCount: records.length,
    passedCount: records.filter((r) => isSubjectPassed(r.status)).length,
  };
}

/** Count subjects by status */
export function countByStatus(
  records: AcademicRecordWithSubject[],
): Map<string, number> {
  const counts = new Map<string, number>();
  records.forEach((r) => {
    const status = r.status;
    counts.set(status, (counts.get(status) || 0) + 1);
  });
  return counts;
}

/** Build difficulty scatter points */
export function buildDifficultyScatterPoints(
  records: AcademicRecordWithSubject[],
): DifficultyScatterPoint[] {
  return records
    .filter((r) => r.difficulty !== null || r.finalGrade !== null)
    .map((r) => ({
      subjectId: r.subjectId,
      subjectName: r.subject.name,
      planCode: r.subject.planCode,
      userPerceivedDifficulty: r.difficulty,
      actualGrade: r.finalGrade,
      status: r.status,
      year: r.subject.year,
    }));
}

/** Build burn-up points (cumulative progress) */
export function buildBurnUpPoints(
  semesters: Map<string, AcademicRecordWithSubject[]>,
  totalSubjectCount: number,
): BurnUpPoint[] {
  const points: BurnUpPoint[] = [];
  let cumulativeCount = 0;

  // Sort semesters chronologically
  const sortedKeys = Array.from(semesters.keys()).sort((a, b) => {
    const [yearA, semA] = a.split('-').map(Number);
    const [yearB, semB] = b.split('-').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return semA - semB;
  });

  sortedKeys.forEach((key) => {
    const [year, semester] = key.split('-').map(Number);
    const records = semesters.get(key) || [];
    const passedThisSemester = records.filter((r) =>
      isSubjectPassed(r.status),
    ).length;
    cumulativeCount += passedThisSemester;

    points.push({
      year,
      semester,
      label: `${year} Q${semester}`,
      cumulativePercentage:
        totalSubjectCount > 0
          ? Math.round((cumulativeCount / totalSubjectCount) * 100 * 100) / 100
          : 0,
      cumulativeCount,
      totalSubjects: totalSubjectCount,
    });
  });

  return points;
}

/** Find top N hardest or easiest subjects by ranking */
export function findTopSubjectsByRanking(
  records: AcademicRecordWithSubject[],
  category: 'mata-promedio' | 'salvavidas',
  limit: number = 5,
): SubjectRankingDto[] {
  const rankings = records
    .filter((r) => r.difficulty !== null || r.finalGrade !== null)
    .map((r) => ({
      subjectId: r.subjectId,
      subjectName: r.subject.name,
      planCode: r.subject.planCode,
      year: r.subject.year,
      avgGrade: r.finalGrade,
      userPerceivedDifficulty: r.difficulty,
      status: r.status,
      category: category,
    }));

  // Sort by difficulty (desc) if mata-promedio, or by grade (desc) if salvavidas
  rankings.sort((a, b) => {
    if (category === 'mata-promedio') {
      // Hardest = higher difficulty + lower grades
      const diffDiff =
        (b.userPerceivedDifficulty || 0) - (a.userPerceivedDifficulty || 0);
      if (diffDiff !== 0) return diffDiff;
      return (a.avgGrade || 0) - (b.avgGrade || 0);
    } else {
      // Easiest = lower difficulty + higher grades
      return (b.avgGrade || 0) - (a.avgGrade || 0);
    }
  });

  return rankings.slice(0, limit);
}
