import { authFetch } from "../../auth/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface SemesterDataPoint {
    year: number;
    semester: number;
    label: string;
    avgGrade: number | null;
    successPercentage: number;
    totalHours: number;
    completedHours: number;
    subjectCount: number;
    passedCount: number;
}

export interface PerformanceChartDto {
    data: SemesterDataPoint[];
}

export interface EfficacyChartDto {
    data: SemesterDataPoint[];
}

export interface AcademicLoadChartDto {
    data: SemesterDataPoint[];
}

export interface SubjectVolumeChartDto {
    data: Array<{
        status: string;
        count: number;
    }>;
}

export interface DifficultyScatterPoint {
    subjectId: string;
    subjectName: string;
    planCode: string;
    userPerceivedDifficulty: number | null;
    actualGrade: number | null;
    status: string;
    year: number;
}

export interface DifficultyScatterChartDto {
    data: DifficultyScatterPoint[];
}

export interface BurnUpPoint {
    year: number;
    semester: number;
    label: string;
    cumulativePercentage: number;
    cumulativeCount: number;
    totalSubjects: number;
}

export interface BurnUpChartDto {
    data: BurnUpPoint[];
}

export interface SubjectRankingDto {
    subjectId: string;
    subjectName: string;
    planCode: string;
    year: number;
    avgGrade: number | null;
    userPerceivedDifficulty: number | null;
    status: string;
    category: 'mata-promedio' | 'salvavidas';
}

export interface SubjectRankingsChartDto {
    mataPromedios: SubjectRankingDto[];
    salvavidas: SubjectRankingDto[];
}

export interface DashboardSummaryDto {
    totalSubjects: number;
    completedSubjects: number;
    completionPercentage: number;
    totalHours: number;
    completedHours: number;
    overallAverageGrade: number | null;
    overallSuccessRate: number;
    currentStreak?: number;
}

export interface ProgressByYearPoint {
    year: number;
    completed: number;
    total: number;
    percentage: number;
}

export interface ProgressByYearChartDto {
    data: ProgressByYearPoint[];
}

export interface DashboardDataDto {
    performanceChart: PerformanceChartDto;
    efficacyChart: EfficacyChartDto;
    academicLoadChart: AcademicLoadChartDto;
    subjectVolumeChart: SubjectVolumeChartDto;
    difficultyScatterChart: DifficultyScatterChartDto;
    burnUpChart: BurnUpChartDto;
    progressByYearChart: ProgressByYearChartDto;
    subjectRankingsChart: SubjectRankingsChartDto;
    summary: DashboardSummaryDto;
}

export async function fetchDashboardData(): Promise<DashboardDataDto> {
    const response = await authFetch(`${API_URL}/dashboard`, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
