/**
 * Dashboard DTOs
 * All chart data for academic performance analytics
 */

/** Per-semester aggregated data point */
export interface SemesterDataPoint {
  year: number;
  semester: number; // 1 or 2
  label: string; // e.g., "2024 Q1" or "2024 S1"
  avgGrade: number | null;
  successPercentage: number; // 0-100
  totalHours: number;
  completedHours: number;
  subjectCount: number;
  passedCount: number;
}

/** Performance Chart DTO - Average grade per semester (line/bar chart) */
export interface PerformanceChartDto {
  data: SemesterDataPoint[];
}

/** Efficacy Chart DTO - Success percentage per semester */
export interface EfficacyChartDto {
  data: SemesterDataPoint[];
}

/** Academic Load Chart DTO - Hours studied vs hours passed */
export interface AcademicLoadChartDto {
  data: SemesterDataPoint[];
}

/** Subject Volume Chart DTO - Count of subjects by status (pie/stacked bar) */
export interface SubjectVolumeChartDto {
  data: Array<{
    status: string; // SubjectStatus value
    count: number;
  }>;
}

/** A single point on the difficulty scatter plot */
export interface DifficultyScatterPoint {
  subjectId: string;
  subjectName: string;
  planCode: string;
  userPerceivedDifficulty: number | null; // 1-10, from difficulty field
  actualGrade: number | null; // final grade achieved
  status: string; // SubjectStatus value
  year: number;
}

/** Difficulty Scatter Chart DTO - x=perceived difficulty, y=grade */
export interface DifficultyScatterChartDto {
  data: DifficultyScatterPoint[];
}

/** A point on the burn-up cumulative chart */
export interface BurnUpPoint {
  year: number;
  semester: number;
  label: string;
  cumulativePercentage: number; // 0-100
  cumulativeCount: number; // subjects passed so far
  totalSubjects: number;
}

/** Burn-up Chart DTO - Cumulative progress to 100% degree completion */
export interface BurnUpChartDto {
  data: BurnUpPoint[];
}

/** Subject ranking entry (hardest or easiest subjects) */
export interface SubjectRankingDto {
  subjectId: string;
  subjectName: string;
  planCode: string;
  year: number;
  avgGrade: number | null;
  userPerceivedDifficulty: number | null;
  status: string; // SubjectStatus value
  category: 'mata-promedio' | 'salvavidas'; // hardest or easiest
}

/** Subject Rankings Chart DTO - Top 5 hardest & easiest subjects */
export interface SubjectRankingsChartDto {
  mataPromedios: SubjectRankingDto[]; // Top 5 hardest (low grades despite effort or high difficulty)
  salvavidas: SubjectRankingDto[]; // Top 5 easiest (high grades, low difficulty)
}

/** Dashboard Summary / KPIs */
export interface DashboardSummaryDto {
  totalSubjects: number;
  completedSubjects: number;
  completionPercentage: number; // 0-100
  totalHours: number;
  completedHours: number;
  overallAverageGrade: number | null;
  overallSuccessRate: number; // 0-100
  currentStreak?: number; // semesters with >80% avg (optional)
}

/** Main Dashboard DTO - Aggregates all chart data */
export interface DashboardDataDto {
  performanceChart: PerformanceChartDto;
  efficacyChart: EfficacyChartDto;
  academicLoadChart: AcademicLoadChartDto;
  subjectVolumeChart: SubjectVolumeChartDto;
  difficultyScatterChart: DifficultyScatterChartDto;
  burnUpChart: BurnUpChartDto;
  subjectRankingsChart: SubjectRankingsChartDto;
  summary: DashboardSummaryDto;
}
