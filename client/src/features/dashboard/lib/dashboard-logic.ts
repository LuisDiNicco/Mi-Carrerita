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

export const TOTAL_CAREER_SUBJECTS = 63; // Hardcoded goal

export function calculateDashboardData(
    subjects: Subject[],
    scope: DashboardScope
): DashboardDataDto {
    const filteredSubjects = subjects.filter(s => {
        if (s.status === SubjectStatus.EQUIVALENCIA) return false;
        if (s.isOptional) {
            const activeStatuses = [SubjectStatus.APROBADA, SubjectStatus.REGULARIZADA, SubjectStatus.EN_CURSO] as string[];
            return activeStatuses.includes(s.status);
        }
        return true;
    });

    // 1. Filter based on scope
    const scopedSubjects =
        scope === 'TOTAL'
            ? filteredSubjects
            : filteredSubjects.filter((s) => s.isIntermediateDegree);

    // 2. Summary Calculation
    const totalSubjects =
        scope === 'TOTAL' ? Math.max(scopedSubjects.length, TOTAL_CAREER_SUBJECTS) : scopedSubjects.length;

    const completed = scopedSubjects.filter((s) => s.status === SubjectStatus.APROBADA);
    const completedCount = completed.length;
    const completionPercentage =
        totalSubjects > 0 ? Math.round((completedCount / totalSubjects) * 100) : 0;

    const widthGrades = completed.filter((s) => s.grade !== null && s.grade > 0);
    const sumGrades = widthGrades.reduce((acc, s) => acc + (s.grade || 0), 0);
    const overallAverageGrade =
        widthGrades.length > 0 ? Number((sumGrades / widthGrades.length).toFixed(2)) : null;

    // Total Hours
    const totalHours = scopedSubjects.reduce((acc, s) => acc + s.hours, 0);
    const completedHours = completed.reduce((acc, s) => acc + s.hours, 0);

    // Success Rate (Passes vs Fails/Retry - simplified as just passes / total attempted if we had attempts, 
    // but here we might just base it on passed vs total subjects? 
    // Actually, backend might calculate this differently (passed / (passed + failed)).
    // Without history of fails, we can assume success rate is high or just calculate based on passed.
    // We'll placeholder this as 100% if we don't have fail history, or maybe just completed %?
    // Let's stick to what we have. If we have no fail info, maybe ignore or set to 100.
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
    const statusCounts: Record<string, number> = {
        [SubjectStatus.APROBADA]: 0,
        [SubjectStatus.REGULARIZADA]: 0,
        [SubjectStatus.EN_CURSO]: 0,
        [SubjectStatus.DISPONIBLE]: 0,
        [SubjectStatus.PENDIENTE]: 0,
        [SubjectStatus.RECURSADA]: 0,
        [SubjectStatus.EQUIVALENCIA]: 0,
    };

    scopedSubjects.forEach((s) => {
        if (statusCounts[s.status] !== undefined) {
            statusCounts[s.status]++;
        }
    });

    // For TOTAL scope, if we have fewer subjects than TOTAL_CAREER_SUBJECTS, 
    // the missing ones are implicitly PENDING/FUTURE. 
    // But usually 'subjects' contains all plan subjects.
    // If subjects.length < TOTAL_CAREER_SUBJECTS, we technically have "Unknown" or "Future".
    // Let's assume subjects array is complete for the plan.

    const subjectVolumeChart: SubjectVolumeChartDto = {
        data: Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count,
        })),
    };

    // 4. Performance Chart (Area) - Avg Grade per Year/Semester
    // We need to group by "Year-Semester" of when it was PASSED.
    // If we don't have updateDate for all, we might fallback to subject.year (plan year).
    // But "Performance" usually implies "Over Time".
    // If statusDate is available for APROBADA, use it.

    const passedWithDate = completed
        .filter((s) => s.statusDate)
        .map((s) => {
            const date = new Date(s.statusDate!);
            return {
                subject: s,
                date,
                year: date.getFullYear(),
                month: date.getMonth(),
            };
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by chronological semester (e.g. 2020-1, 2020-2)
    const semesters = new Map<string, { sum: number; count: number; date: number }>();

    passedWithDate.forEach((item) => {
        const semester = item.month < 6 ? 1 : 2;
        const key = `${item.year}-${semester}`;
        if (!semesters.has(key)) {
            semesters.set(key, { sum: 0, count: 0, date: item.date.getTime() });
        }
        const entry = semesters.get(key)!;
        if (item.subject.grade) {
            entry.sum += item.subject.grade;
            entry.count++;
        }
    });

    const performanceData: SemesterDataPoint[] = Array.from(semesters.entries())
        .map(([label, data]) => ({
            year: parseInt(label.split('-')[0]),
            semester: parseInt(label.split('-')[1]),
            label,
            avgGrade: data.count > 0 ? Number((data.sum / data.count).toFixed(2)) : null,
            successPercentage: 100, // Placeholder
            totalHours: 0,
            completedHours: 0,
            subjectCount: 0,
            passedCount: data.count,
        }))
        .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.semester - b.semester;
        });

    const performanceChart: PerformanceChartDto = {
        data: performanceData,
    };

    // 5. Burn Up Chart
    // Cumulative progress over time
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

    // 6. Difficulty Scatter
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
        if (s.status === SubjectStatus.APROBADA) {
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

    // Dummy Ranking (not requested to be perfect yet, just placeholder structure)
    const subjectRankingsChart = {
        mataPromedios: [],
        salvavidas: [],
    };

    // Efficacy and Load charts - placeholders or derived similarly
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
