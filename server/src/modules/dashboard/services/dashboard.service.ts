import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DashboardDataDto,
  PerformanceChartDto,
  EfficacyChartDto,
  AcademicLoadChartDto,
  SubjectVolumeChartDto,
  DifficultyScatterChartDto,
  BurnUpChartDto,
  SubjectRankingsChartDto,
  DashboardSummaryDto,
  SemesterDataPoint,
} from '../dto';
import {
  groupBySemester,
  calculateAverage,
  calculateSuccessPercentage,
  isSubjectPassed,
  calculateCompletedHours,
  calculateTotalHours,
  buildSemesterDataPoint,
  countByStatus,
  buildDifficultyScatterPoints,
  buildBurnUpPoints,
  findTopSubjectsByRanking,
} from '../helpers/dashboard.helpers';
import { AcademicRecordWithSubject } from '../../../shared/types/database.types';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  /**
   * Get complete dashboard data with all charts and summary
   */
  async getDashboardData(userEmail: string): Promise<DashboardDataDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Fetch all academic records for this user with subject data
    const records = await this.prisma.academicRecord.findMany({
      where: { userId: user.id },
      include: {
        subject: {
          select: {
            id: true,
            planCode: true,
            name: true,
            year: true,
            hours: true,
            isOptional: true,
          },
        },
      },
    });

    // Cast to correct type for helper functions
    const typedRecords = records as unknown as AcademicRecordWithSubject[];

    // Group by semester
    const semesters = groupBySemester(typedRecords);

    // Build semester data points sorted chronologically
    const semesterDataPoints: SemesterDataPoint[] = Array.from(
      semesters.entries(),
    )
      .map(([key, semRecords]) => {
        const [year, semester] = key.split('-').map(Number);
        return buildSemesterDataPoint(year, semester, semRecords);
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.semester - b.semester;
      });

    // Build charts
    const performanceChart = this.buildPerformanceChart(semesterDataPoints);
    const efficacyChart = this.buildEfficacyChart(semesterDataPoints);
    const academicLoadChart = this.buildAcademicLoadChart(semesterDataPoints);
    const subjectVolumeChart = this.buildSubjectVolumeChart(typedRecords);
    const difficultyScatterChart =
      this.buildDifficultyScatterChart(typedRecords);
    const burnUpChart = this.buildBurnUpChart(semesters, typedRecords.length);
    const subjectRankingsChart = this.buildSubjectRankingsChart(typedRecords);

    // Build summary
    const summary = this.buildDashboardSummary(
      typedRecords,
      semesterDataPoints,
    );

    return {
      performanceChart,
      efficacyChart,
      academicLoadChart,
      subjectVolumeChart,
      difficultyScatterChart,
      burnUpChart,
      subjectRankingsChart,
      summary,
    };
  }

  /**
   * Performance Chart: Average grade per semester
   */
  private buildPerformanceChart(
    dataPoints: SemesterDataPoint[],
  ): PerformanceChartDto {
    return {
      data: dataPoints.map((dp) => ({
        ...dp,
      })),
    };
  }

  /**
   * Efficacy Chart: Success percentage per semester
   */
  private buildEfficacyChart(
    dataPoints: SemesterDataPoint[],
  ): EfficacyChartDto {
    return {
      data: dataPoints.map((dp) => ({
        ...dp,
      })),
    };
  }

  /**
   * Academic Load Chart: Hours studied vs passed per semester
   */
  private buildAcademicLoadChart(
    dataPoints: SemesterDataPoint[],
  ): AcademicLoadChartDto {
    return {
      data: dataPoints.map((dp) => ({
        ...dp,
      })),
    };
  }

  /**
   * Subject Volume Chart: Count by status (pie/stacked bar)
   */
  private buildSubjectVolumeChart(
    records: AcademicRecordWithSubject[],
  ): SubjectVolumeChartDto {
    const statusCounts = countByStatus(records);
    return {
      data: Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
      })),
    };
  }

  /**
   * Difficulty Scatter Chart: Perceived difficulty vs actual grade
   */
  private buildDifficultyScatterChart(
    records: AcademicRecordWithSubject[],
  ): DifficultyScatterChartDto {
    const data = buildDifficultyScatterPoints(records);
    return { data };
  }

  /**
   * Burn-up Chart: Cumulative progress towards 100% degree completion
   */
  private buildBurnUpChart(
    semesters: Map<string, AcademicRecordWithSubject[]>,
    totalSubjectCount: number,
  ): BurnUpChartDto {
    const data = buildBurnUpPoints(semesters, totalSubjectCount);
    return { data };
  }

  /**
   * Subject Rankings Chart: Top 5 hardest & easiest subjects
   */
  private buildSubjectRankingsChart(
    records: AcademicRecordWithSubject[],
  ): SubjectRankingsChartDto {
    const mataPromedios = findTopSubjectsByRanking(records, 'mata-promedio', 5);
    const salvavidas = findTopSubjectsByRanking(records, 'salvavidas', 5);

    return {
      mataPromedios,
      salvavidas,
    };
  }

  /**
   * Dashboard Summary: KPIs and overall statistics
   */
  private buildDashboardSummary(
    records: AcademicRecordWithSubject[],
    semesters: SemesterDataPoint[],
  ): DashboardSummaryDto {
    const totalSubjects = records.length;
    const completedSubjects = records.filter((r) =>
      isSubjectPassed(r.status),
    ).length;
    const completionPercentage =
      totalSubjects > 0
        ? Math.round((completedSubjects / totalSubjects) * 100 * 100) / 100
        : 0;

    const totalHours = calculateTotalHours(records);
    const completedHours = calculateCompletedHours(records);

    const grades = records
      .filter((r) => r.finalGrade !== null)
      .map((r) => r.finalGrade);
    const overallAverageGrade = calculateAverage(grades);

    const statuses = records.map((r) => r.status);
    const overallSuccessRate = calculateSuccessPercentage(statuses);

    // Current streak: number of consecutive semesters with >80% avg
    let currentStreak = 0;
    for (let i = semesters.length - 1; i >= 0; i--) {
      const dp = semesters[i];
      if (dp.avgGrade !== null && dp.avgGrade >= 80) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalSubjects,
      completedSubjects,
      completionPercentage,
      totalHours,
      completedHours,
      overallAverageGrade,
      overallSuccessRate,
      currentStreak: currentStreak > 0 ? currentStreak : undefined,
    };
  }
}
