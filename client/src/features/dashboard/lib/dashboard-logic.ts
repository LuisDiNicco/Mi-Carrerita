import { type Subject, SubjectStatus } from '../../../shared/types/academic';
import type {
    DashboardDataDto,
    SubjectVolumeChartDto,
    PerformanceChartDto,
    BurnUpChartDto,
    DifficultyScatterChartDto,
    DashboardSummaryDto,
    SemesterDataPoint,
} from './dashboard-api';

export type DashboardScope = 'TOTAL' | 'INTERMEDIATE';

// 62 materias obligatorias. "Taller de Integración" es la única optativa
// y no se cuenta aquí — si fue cursada, el total sube a 63 naturalmente
// por la lógica de filteredSubjects en calculateDashboardData.
export const TOTAL_CAREER_SUBJECTS = 62; // 62 obligatorias (sin Taller de Integración)

/**
 * Returns the academic quarter (1, 2 or 3) for a given month (0-indexed, JS convention).
 *
 * UNLAM academic calendar — actas are passed at end of each quarter:
 *   Q3 (Verano):           Jan–Mar  → months 0–2  (actas en feb/marzo)
 *   Q1 (1er cuatrimestre): Apr–Aug  → months 3–7  (actas en julio/agosto)
 *   Q2 (2do cuatrimestre): Sep–Dec  → months 8–11 (actas en nov/diciembre)
 *
 * Note: Q3 of year Y is the summer between 2C(Y-1) and 1C(Y).
 * E.g. 05/03/2022 → Q3 → label "3C2022".
 */
function getQuarter(month: number): 1 | 2 | 3 {
    if (month >= 0 && month <= 2) return 3;  // Jan–Mar (Verano / 3er cuatrimestre)
    if (month >= 3 && month <= 7) return 1;  // Apr–Aug (1er cuatrimestre)
    return 2;                                // Sep–Dec (2do cuatrimestre)
}

/** Builds the quarter label in format `1C2025` */
function buildQuarterLabel(year: number, quarter: 1 | 2 | 3): string {
    return `${quarter}C${year}`;
}

/** Numeric sort key for a quarter, for chronological ordering */
function quarterSortKey(year: number, quarter: 1 | 2 | 3): number {
    // Q3 of year Y comes BEFORE Q1 of year Y (it's the summer before)
    // We treat Q3 as the start of the year cycle: Q3(Y) < Q1(Y) < Q2(Y)
    const intraYear = quarter === 3 ? 0 : quarter; // 3→0, 1→1, 2→2
    return year * 10 + intraYear;
}

export function calculateDashboardData(
    subjects: Subject[],
    scope: DashboardScope
): DashboardDataDto {
    // Filter optionals that aren't active, but keep EQUIVALENCIA subjects
    const filteredSubjects = subjects.filter(s => {
        if (s.isOptional) {
            const activeStatuses = [SubjectStatus.APROBADA, SubjectStatus.REGULARIZADA, SubjectStatus.EN_CURSO, SubjectStatus.EQUIVALENCIA] as string[];
            return activeStatuses.includes(s.status);
        }
        return true;
    });

    // 1. Filter based on scope
    const scopedSubjects =
        scope === 'TOTAL'
            ? filteredSubjects
            : filteredSubjects.filter((s) => s.isIntermediateDegree);

    // 2. "Completed" = APROBADA + EQUIVALENCIA (both count as passed)
    const isCompleted = (s: Subject) =>
        s.status === SubjectStatus.APROBADA || s.status === SubjectStatus.EQUIVALENCIA;

    const completed = scopedSubjects.filter(isCompleted);
    const completedCount = completed.length;

    const totalSubjects =
        scope === 'TOTAL' ? Math.max(scopedSubjects.length, TOTAL_CAREER_SUBJECTS) : scopedSubjects.length;

    const completionPercentage =
        totalSubjects > 0 ? Math.round((completedCount / totalSubjects) * 100) : 0;

    // Average: only subjects with a grade (excludes equivalencias without grade)
    const withGrades = completed.filter((s) => s.grade !== null && s.grade > 0);
    const sumGrades = withGrades.reduce((acc, s) => acc + (s.grade || 0), 0);
    const overallAverageGrade =
        withGrades.length > 0 ? Number((sumGrades / withGrades.length).toFixed(2)) : null;

    // Total Hours
    const totalHours = scopedSubjects.reduce((acc, s) => acc + s.hours, 0);
    const completedHours = completed.reduce((acc, s) => acc + s.hours, 0);

    const overallSuccessRate = 100;

    const summary: DashboardSummaryDto = {
        totalSubjects,
        completedSubjects: completedCount,
        completionPercentage,
        totalHours,
        completedHours,
        overallAverageGrade,
        overallSuccessRate,
    };

    // 3. Subject Volume Chart
    // Show EQUIVALENCIA as part of "Aprobadas" in the pie (merge them visually)
    const statusCounts: Record<string, number> = {
        [SubjectStatus.APROBADA]: 0,
        [SubjectStatus.REGULARIZADA]: 0,
        [SubjectStatus.EN_CURSO]: 0,
        [SubjectStatus.DISPONIBLE]: 0,
        [SubjectStatus.PENDIENTE]: 0,
        [SubjectStatus.RECURSADA]: 0,
    };

    scopedSubjects.forEach((s) => {
        if (s.status === SubjectStatus.EQUIVALENCIA) {
            // Count equivalencias alongside APROBADA
            statusCounts[SubjectStatus.APROBADA]++;
        } else if (statusCounts[s.status] !== undefined) {
            statusCounts[s.status]++;
        }
    });

    const subjectVolumeChart: SubjectVolumeChartDto = {
        data: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
        })),
    };

    // 4. Performance & BurnUp Charts using proper quarter system
    // Only include completed subjects with a statusDate
    // For grade chart: only include subjects that have a grade (excludes equivalencias without grade)
    const completedWithDate = completed
        .filter((s) => s.statusDate)
        .map((s) => {
            const date = new Date(s.statusDate!);
            const year = date.getFullYear();
            const month = date.getMonth();
            const quarter = getQuarter(month);
            return {
                subject: s,
                date,
                year,
                month,
                quarter,
                quarterKey: buildQuarterLabel(year, quarter),
                sortKey: quarterSortKey(year, quarter),
            };
        })
        .sort((a, b) => a.sortKey - b.sortKey || a.date.getTime() - b.date.getTime());

    // Group by quarter for performance chart (only subjects with grades for avg calculation)
    type QuarterEntry = { gradeSum: number; gradeCount: number; totalPassed: number; sortKey: number; year: number; quarter: 1 | 2 | 3 };
    const quarterMap = new Map<string, QuarterEntry>();

    completedWithDate.forEach((item) => {
        const key = item.quarterKey;
        if (!quarterMap.has(key)) {
            quarterMap.set(key, {
                gradeSum: 0,
                gradeCount: 0,
                totalPassed: 0,
                sortKey: item.sortKey,
                year: item.year,
                quarter: item.quarter,
            });
        }
        const entry = quarterMap.get(key)!;
        entry.totalPassed++;
        if (item.subject.grade !== null && item.subject.grade > 0) {
            entry.gradeSum += item.subject.grade;
            entry.gradeCount++;
        }
    });

    // Sort quarters chronologically
    const sortedQuarters = Array.from(quarterMap.entries()).sort(
        ([, a], [, b]) => a.sortKey - b.sortKey
    );

    // Cumulative average grade over time (running total)
    let runningGradeSum = 0;
    let runningGradeCount = 0;

    const performanceData: SemesterDataPoint[] = sortedQuarters.map(([label, data]) => {
        runningGradeSum += data.gradeSum;
        runningGradeCount += data.gradeCount;
        const avgGrade = runningGradeCount > 0
            ? Number((runningGradeSum / runningGradeCount).toFixed(2))
            : null;
        return {
            year: data.year,
            semester: data.quarter,
            label,
            avgGrade,
            successPercentage: 100,
            totalHours: 0,
            completedHours: 0,
            subjectCount: 0,
            passedCount: data.totalPassed,
        };
    });

    const performanceChart: PerformanceChartDto = {
        data: performanceData,
    };

    // 5. Burn Up Chart — cumulative progress over quarters
    let cumulativeCount = 0;
    const burnUpData = performanceData.map((point) => {
        cumulativeCount += point.passedCount;
        return {
            year: point.year,
            semester: point.semester,
            label: point.label,
            cumulativePercentage: Math.round((cumulativeCount / totalSubjects) * 100),
            cumulativeCount,
            totalSubjects,
        };
    });

    const burnUpChart: BurnUpChartDto = {
        data: burnUpData,
    };

    // 6. Difficulty Scatter — only subjects with both difficulty and grade
    const difficultyData = completed
        .filter((s) => s.difficulty && s.grade)
        .map((s) => ({
            subjectId: s.id,
            subjectName: s.name,
            planCode: s.planCode,
            userPerceivedDifficulty: s.difficulty ?? null,
            actualGrade: s.grade,
            status: s.status,
            year: s.year,
        }));

    const difficultyScatterChart: DifficultyScatterChartDto = {
        data: difficultyData,
    };

    // 7. Progress by Year of Plan
    const progressByYearMap = new Map<number, { completed: number; total: number }>();
    scopedSubjects.forEach((s) => {
        if (!progressByYearMap.has(s.year)) {
            progressByYearMap.set(s.year, { completed: 0, total: 0 });
        }
        const data = progressByYearMap.get(s.year)!;
        data.total += 1;
        if (isCompleted(s)) {
            data.completed += 1;
        }
    });

    const progressByYearData = Array.from(progressByYearMap.entries())
        .map(([year, data]) => ({
            year,
            completed: data.completed,
            total: data.total,
            percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.year - b.year);

    const progressByYearChart = {
        data: progressByYearData,
    };

    const subjectRankingsChart = {
        mataPromedios: [],
        salvavidas: [],
    };

    const efficacyChart = { data: [] };
    const academicLoadChart = { data: [] };

    return {
        summary,
        subjectVolumeChart,
        performanceChart,
        efficacyChart,
        academicLoadChart,
        difficultyScatterChart,
        burnUpChart,
        progressByYearChart,
        subjectRankingsChart,
    };
}
