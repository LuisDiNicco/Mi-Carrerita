import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrophyCaseDto, TrophyDto } from '../dto';
import {
  TrophyTier,
} from '../../../common/constants/trophy-enums';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import {
  TROPHY_DEFINITIONS,
  getTrophiesByTier,
} from '../helpers/trophy-definitions';
import {
  AcademicRecordWithSubject,
  TrophyEvaluationContext,
} from '../types/trophy.types';

@Injectable()
export class TrophyService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  /**
   * Initialize trophy definitions on module startup
   */
  async onModuleInit(): Promise<void> {
    await this.seedTrophies();
  }

  /**
   * Seed trophy definitions into database (one-time on startup)
   */
  async seedTrophies(): Promise<void> {
    const existing = await this.prisma.trophy.findMany({
      select: { code: true },
    });
    const existingCodes = new Set(existing.map((t) => t.code));
    const missing = TROPHY_DEFINITIONS.filter(
      (def) => !existingCodes.has(def.code),
    );

    if (missing.length === 0) {
      return;
    }

    await this.prisma.$transaction(
      missing.map((def) =>
        this.prisma.trophy.create({
          data: {
            code: def.code,
            name: def.name,
            description: def.description,
            tier: def.tier,
            icon: def.icon,
            rarity: def.rarity,
            criteria: def.criteria ?? null,
          },
        }),
      ),
    );
  }

  /**
   * Check and unlock trophies for a user
   */
  async checkAndUnlockTrophies(userEmail: string): Promise<TrophyDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const [trophies, userTrophies] = await this.prisma.$transaction([
      this.prisma.trophy.findMany({
        where: { code: { in: TROPHY_DEFINITIONS.map((d) => d.code) } },
      }),
      this.prisma.userTrophy.findMany({
        where: { userId: user.id },
        select: { trophyId: true, unlockedAt: true },
      }),
    ]);

    const context = await this.buildEvaluationContext(user.id, user.email);

    const trophyByCode = new Map(trophies.map((t) => [t.code, t]));
    const userTrophyById = new Map(
      userTrophies.map((t) => [t.trophyId, t]),
    );

    const newlyUnlocked: TrophyDto[] = [];

    for (const definition of TROPHY_DEFINITIONS) {
      const trophyRecord = trophyByCode.get(definition.code);
      if (!trophyRecord) {
        continue;
      }

      const isUnlocked = await this.evaluateTrophyCriteria(
        definition.code,
        context,
      );

      const existing = userTrophyById.get(trophyRecord.id);
      if (isUnlocked && !existing?.unlockedAt) {
        await this.prisma.userTrophy.upsert({
          where: {
            userId_trophyId: {
              userId: user.id,
              trophyId: trophyRecord.id,
            },
          },
          create: {
            userId: user.id,
            trophyId: trophyRecord.id,
            unlockedAt: new Date(),
            progress: 100,
          },
          update: {
            unlockedAt: new Date(),
            progress: 100,
          },
        });

        newlyUnlocked.push({
          id: trophyRecord.id,
          code: definition.code,
          name: definition.name,
          description: definition.description || '',
          tier: definition.tier as TrophyTier,
          icon: definition.icon,
          rarity: definition.rarity,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          progress: 100,
        });
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get user's complete trophy case
   */
  async getTrophyCase(userEmail: string): Promise<TrophyCaseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Get all trophies and their unlock status
    const allTrophies = await this.prisma.trophy.findMany({
      include: {
        userTrophies: {
          where: { userId: user.id },
          select: {
            unlockedAt: true,
            progress: true,
            metadata: true,
          },
        },
      },
    });

    const trophyDtos: TrophyDto[] = allTrophies.map((t) => {
      const userStatus = t.userTrophies[0];
      return {
        id: t.id,
        code: t.code,
        name: t.name,
        description: t.description || '',
        tier: t.tier as TrophyTier,
        icon: t.icon,
        rarity: t.rarity,
        unlocked: !!userStatus?.unlockedAt,
        unlockedAt: userStatus?.unlockedAt?.toISOString(),
        progress: userStatus?.progress || 0,
        criteria: t.criteria || undefined,
      };
    });

    // Count by tier
    const unlockedTrophies = trophyDtos.filter((t) => t.unlocked);
    const byTier: TrophyCaseDto['byTier'] = {
      bronze: {
        tier: TrophyTier.BRONZE,
        unlocked: unlockedTrophies.filter((t) => t.tier === TrophyTier.BRONZE)
          .length,
        total: getTrophiesByTier(TrophyTier.BRONZE).length,
        percentage: 0,
      },
      silver: {
        tier: TrophyTier.SILVER,
        unlocked: unlockedTrophies.filter((t) => t.tier === TrophyTier.SILVER)
          .length,
        total: getTrophiesByTier(TrophyTier.SILVER).length,
        percentage: 0,
      },
      gold: {
        tier: TrophyTier.GOLD,
        unlocked: unlockedTrophies.filter((t) => t.tier === TrophyTier.GOLD)
          .length,
        total: getTrophiesByTier(TrophyTier.GOLD).length,
        percentage: 0,
      },
      platinum: {
        tier: TrophyTier.PLATINUM,
        unlocked: unlockedTrophies.filter((t) => t.tier === TrophyTier.PLATINUM)
          .length,
        total: getTrophiesByTier(TrophyTier.PLATINUM).length,
        percentage: 0,
      },
    };

    // Calculate percentages
    Object.keys(byTier).forEach((key) => {
      const tier = byTier[key as keyof typeof byTier];
      tier.percentage =
        tier.total > 0 ? Math.round((tier.unlocked / tier.total) * 100) : 0;
    });

    // Get recently unlocked
    const recentlyUnlocked = trophyDtos
      .filter((t) => t.unlocked && t.unlockedAt)
      .sort(
        (a, b) =>
          new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime(),
      )
      .slice(0, 5);

    const totalUnlocked = unlockedTrophies.length;
    const totalCount = allTrophies.length;

    return {
      totalTrophies: totalCount,
      unlockedCount: totalUnlocked,
      unlockedPercentage:
        totalCount > 0 ? Math.round((totalUnlocked / totalCount) * 100) : 0,
      byTier,
      trophies: trophyDtos,
      recentlyUnlocked,
    };
  }

  /**
   * Get a specific trophy
   */
  async getTrophy(userEmail: string, trophyCode: string): Promise<TrophyDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const trophy = await this.prisma.trophy.findUnique({
      where: { code: trophyCode },
      include: {
        userTrophies: {
          where: { userId: user.id },
          select: {
            unlockedAt: true,
            progress: true,
          },
        },
      },
    });

    if (!trophy) {
      throw new NotFoundException('Trophy no encontrado.');
    }

    const userStatus = trophy.userTrophies[0];
    return {
      id: trophy.id,
      code: trophy.code,
      name: trophy.name,
      description: trophy.description || '',
      tier: trophy.tier as TrophyTier,
      icon: trophy.icon,
      rarity: trophy.rarity,
      unlocked: !!userStatus?.unlockedAt,
      unlockedAt: userStatus?.unlockedAt?.toISOString(),
      progress: userStatus?.progress || 0,
      criteria: trophy.criteria || undefined,
    };
  }

  /**
   * Internal: Evaluate trophy unlock criteria
   */
  private async evaluateTrophyCriteria(
    code: string,
    context: TrophyEvaluationContext,
  ): Promise<boolean> {
    const records = context.subjectRecords;
    const completedSubjects = records.filter(
      (r) =>
        r.status === SubjectStatus.APROBADA ||
        r.status === SubjectStatus.REGULARIZADA,
    );
    const completionPercentage =
      context.totalSubjects > 0
        ? (completedSubjects.length / context.totalSubjects) * 100
        : 0;

    // Define criteria evaluation
    const criteriaMap: Record<string, boolean> = {
      FIRST_SUBJECT_COMPLETED: completedSubjects.length >= 1,
      THREE_SUBJECT_STREAK: completedSubjects.length >= 3,
      PERFECT_SCORE_100: records.some((r) => r.finalGrade === 100),
      COMEBACK_PASS: this.checkComebackPass(records),
      DIFFICULT_SUBJECT_PASSED: completedSubjects.some(
        (r) => r.difficulty! >= 8,
      ),
      ALL_OPTIONALS_COMPLETED: this.checkAllOptionalsCompleted(records),
      SEMESTER_AVERAGE_90: this.checkSemesterAverage90(records),
      YEAR_NO_FAILURES: this.checkYearNoFailures(records),
      TEN_SUBJECTS_PASSED: completedSubjects.length >= 10,
      EARLY_BIRD: this.checkEarlyBird(records),
      CONSISTENCY_BRONZE: this.checkConsistency(records, 5),
      AVERAGE_80_OVERALL: this.checkOverallAverage(records, 80),
      MIXED_STATUS_PASS: this.checkMixedStatus(records),
      SUBJECT_RETRY_SUCCESS: this.checkRetrySuccess(records),
      HOURS_100_COMPLETED: this.checkHoursCompleted(records, 100),

      // SILVER
      HALFWAY_COMPLETION: completionPercentage >= 50,
      TWO_SEMESTERS_CLEAN: this.checkConsecutiveCleanSemesters(records, 2),
      MASTER_OF_BALANCE: this.checkOverallAverage(records, 80),
      INTERMEDIATE_DEGREE: this.checkIntermediateDegree(records),
      CONSISTENCY_SILVER: this.checkConsistency(records, 8),
      PERFECT_SEMESTER: this.checkPerfectSemester(records),
      HIGH_DIFFICULTY_MASTERY:
        completedSubjects.filter((r) => r.difficulty! >= 7).length >= 5,
      QUICK_PROGRESS: this.checkQuickProgress(records),
      EXCELLENCE_85_PLUS: this.checkOverallAverage(records, 85),
      STRATEGIC_PLANNING: completedSubjects.length >= 20,

      // GOLD
      CAREER_COMPLETION: completionPercentage >= 100,
      PERFECT_AVERAGE: this.checkOverallAverage(records, 90),
      SPEED_RUNNER: this.checkSpeedRunner(records, completionPercentage),
      FLAWLESS_EXECUTION:
        completedSubjects.length >= context.totalSubjects * 0.9,
      CONSISTENT_EXCELLENCE: this.checkConsistentExcellence(records),
      CHALLENGE_ACCEPTED: this.checkChallengeAccepted(records),
      MARATHON_CHAMPION: this.checkHoursCompleted(records, 200),

      // PLATINUM
      LEGEND:
        completionPercentage >= 100 &&
        this.checkOverallAverage(records, 90) &&
        records.filter((r) => r.status !== SubjectStatus.APROBADA).length === 0,
    };

    return criteriaMap[code] ?? false;
  }

  private async buildEvaluationContext(
    userId: string,
    userEmail: string,
  ): Promise<TrophyEvaluationContext> {
    const [records, subjectStats] = await this.prisma.$transaction([
      this.prisma.academicRecord.findMany({
        where: { userId },
        include: { subject: true },
      }),
      this.prisma.subject.aggregate({
        _count: { id: true },
        _sum: { hours: true },
      }),
    ]);

    const completedRecords = records.filter(
      (r) =>
        r.status === SubjectStatus.APROBADA ||
        r.status === SubjectStatus.REGULARIZADA,
    );

    const completedHours = completedRecords.reduce(
      (sum, record) => sum + (record.subject.hours || 0),
      0,
    );

    return {
      userId,
      userEmail,
      totalSubjects: subjectStats._count.id,
      completedSubjects: completedRecords.length,
      totalHours: subjectStats._sum.hours ?? 0,
      completedHours,
      grades: records.map((record) => record.finalGrade ?? null),
      hasIntermediateDegree: records.some((record) => record.isIntermediate),
      subjectRecords: records,
    };
  }

  // Helper methods for complex criteria evaluation

  private checkAllOptionalsCompleted(
    records: AcademicRecordWithSubject[],
  ): boolean {
    const optionals = records.filter((r) => r.subject.isOptional);
    const completedOptionals = optionals.filter(
      (r) =>
        r.status === SubjectStatus.APROBADA ||
        r.status === SubjectStatus.REGULARIZADA,
    );
    return (
      optionals.length > 0 && optionals.length === completedOptionals.length
    );
  }

  private checkSemesterAverage90(
    records: AcademicRecordWithSubject[],
  ): boolean {
    const semesterGroups = this.groupBySemester(records);
    for (const semesterRecords of semesterGroups.values()) {
      const grades = semesterRecords
        .map((r) => r.finalGrade)
        .filter((grade): grade is number => typeof grade === 'number');
      if (grades.length === 0) continue;
      const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      if (average >= 90) {
        return true;
      }
    }
    return false;
  }

  private checkYearNoFailures(records: AcademicRecordWithSubject[]): boolean {
    const yearGroups = this.groupByYear(records);
    for (const yearRecords of yearGroups.values()) {
      if (yearRecords.length === 0) continue;
      const allPassed = yearRecords.every((r) => this.isPassed(r));
      if (allPassed) {
        return true;
      }
    }
    return false;
  }

  private checkConsistency(
    records: AcademicRecordWithSubject[],
    minSemesters: number,
  ): boolean {
    const semesterGroups = this.groupBySemester(records);
    let count = 0;
    for (const semesterRecords of semesterGroups.values()) {
      if (semesterRecords.some((r) => this.isPassed(r))) {
        count += 1;
      }
    }
    return count >= minSemesters;
  }

  private checkOverallAverage(
    records: AcademicRecordWithSubject[],
    threshold: number,
  ): boolean {
    const grades = records
      .map((r) => r.finalGrade)
      .filter((grade): grade is number => typeof grade === 'number');
    if (grades.length === 0) return false;
    const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    return average >= threshold;
  }

  private checkMixedStatus(records: AcademicRecordWithSubject[]): boolean {
    const hasRegularized = records.some(
      (r) => r.status === SubjectStatus.REGULARIZADA,
    );
    const hasFinal = records.some((r) => r.status === SubjectStatus.APROBADA);
    return hasRegularized && hasFinal;
  }

  private checkHoursCompleted(
    records: AcademicRecordWithSubject[],
    minHours: number,
  ): boolean {
    const completed = records
      .filter(
        (r) =>
          r.status === SubjectStatus.APROBADA ||
          r.status === SubjectStatus.REGULARIZADA,
      )
      .reduce((sum, r) => sum + (r.subject.hours || 0), 0);
    return completed >= minHours;
  }

  private checkConsecutiveCleanSemesters(
    records: AcademicRecordWithSubject[],
    minSemesters: number,
  ): boolean {
    const semesterGroups = this.groupBySemester(records);
    const semesters = Array.from(semesterGroups.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => this.semesterIndex(a.key) - this.semesterIndex(b.key));

    let streak = 0;
    let lastIndex: number | null = null;
    for (const { key, value } of semesters) {
      const isClean = value.length > 0 && value.every((r) => this.isPassed(r));
      const index = this.semesterIndex(key);
      if (isClean && (lastIndex === null || index === lastIndex + 1)) {
        streak += 1;
      } else if (isClean) {
        streak = 1;
      } else {
        streak = 0;
      }
      lastIndex = isClean ? index : lastIndex;

      if (streak >= minSemesters) {
        return true;
      }
    }

    return false;
  }

  private checkIntermediateDegree(records: AcademicRecordWithSubject[]): boolean {
    return records.some((r) => r.isIntermediate && this.isPassed(r));
  }

  private checkPerfectSemester(records: AcademicRecordWithSubject[]): boolean {
    const semesterGroups = this.groupBySemester(records);
    for (const semesterRecords of semesterGroups.values()) {
      if (semesterRecords.length === 0) continue;
      if (!semesterRecords.every((r) => this.isPassed(r))) continue;
      const grades = semesterRecords
        .map((r) => r.finalGrade)
        .filter((grade): grade is number => typeof grade === 'number');
      if (grades.length === 0) continue;
      const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      if (average >= 90) {
        return true;
      }
    }
    return false;
  }

  private checkQuickProgress(records: AcademicRecordWithSubject[]): boolean {
    const semesterGroups = this.groupBySemester(records);
    for (const semesterRecords of semesterGroups.values()) {
      const completedHours = semesterRecords
        .filter((r) => this.isPassed(r))
        .reduce((sum, r) => sum + (r.subject.hours || 0), 0);
      if (completedHours >= 15) {
        return true;
      }
    }
    return false;
  }

  private checkConsistentExcellence(
    records: AcademicRecordWithSubject[],
  ): boolean {
    const semesterGroups = this.groupBySemester(records);
    const semesterAverages: number[] = [];

    for (const semesterRecords of semesterGroups.values()) {
      const grades = semesterRecords
        .map((r) => r.finalGrade)
        .filter((grade): grade is number => typeof grade === 'number');
      if (grades.length === 0) continue;
      const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      semesterAverages.push(average);
    }

    if (semesterAverages.length === 0) {
      return false;
    }

    const excellentCount = semesterAverages.filter((avg) => avg >= 85).length;
    return excellentCount / semesterAverages.length >= 0.8;
  }

  private checkComebackPass(records: AcademicRecordWithSubject[]): boolean {
    return records.some(
      (record) =>
        this.isPassed(record) &&
        this.getAttemptCount(record.notes) >= 2,
    );
  }

  private checkRetrySuccess(records: AcademicRecordWithSubject[]): boolean {
    return records.some(
      (record) =>
        this.isPassed(record) &&
        this.getAttemptCount(record.notes) >= 3,
    );
  }

  private checkEarlyBird(records: AcademicRecordWithSubject[]): boolean {
    const pending = records.filter((r) => !this.isPassed(r));
    const minPendingYear = pending.reduce(
      (min, record) => Math.min(min, record.subject.year),
      Number.POSITIVE_INFINITY,
    );

    if (minPendingYear === Number.POSITIVE_INFINITY) {
      return false;
    }

    return records.some(
      (record) =>
        this.isPassed(record) && record.subject.year > minPendingYear,
    );
  }

  private checkSpeedRunner(
    records: AcademicRecordWithSubject[],
    completionPercentage: number,
  ): boolean {
    if (completionPercentage < 100) {
      return false;
    }

    const dates = records
      .filter((r) => this.isPassed(r) && r.statusDate)
      .map((r) => r.statusDate as Date)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length < 2) {
      return false;
    }

    const durationMs = dates[dates.length - 1].getTime() - dates[0].getTime();
    const durationYears = durationMs / (1000 * 60 * 60 * 24 * 365);
    return durationYears <= 2.5;
  }

  private checkChallengeAccepted(records: AcademicRecordWithSubject[]): boolean {
    const difficult = records
      .filter((r) => typeof r.difficulty === 'number')
      .sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0))
      .slice(0, 5);

    if (difficult.length === 0) {
      return false;
    }

    return difficult.every((record) => this.isPassed(record));
  }

  private groupByYear(
    records: AcademicRecordWithSubject[],
  ): Map<number, AcademicRecordWithSubject[]> {
    const grouped = new Map<number, AcademicRecordWithSubject[]>();
    for (const record of records) {
      const year = record.subject.year;
      const list = grouped.get(year) ?? [];
      list.push(record);
      grouped.set(year, list);
    }
    return grouped;
  }

  private groupBySemester(
    records: AcademicRecordWithSubject[],
  ): Map<string, AcademicRecordWithSubject[]> {
    const grouped = new Map<string, AcademicRecordWithSubject[]>();
    for (const record of records) {
      if (!record.statusDate) continue;
      const key = this.getSemesterKey(record.statusDate);
      const list = grouped.get(key) ?? [];
      list.push(record);
      grouped.set(key, list);
    }
    return grouped;
  }

  private getSemesterKey(date: Date): string {
    const year = date.getFullYear();
    const semester = date.getMonth() + 1 <= 6 ? 1 : 2;
    return `${year}-${semester}`;
  }

  private semesterIndex(key: string): number {
    const [year, semester] = key.split('-').map(Number);
    return year * 2 + semester;
  }

  private isPassed(record: AcademicRecordWithSubject): boolean {
    return (
      record.status === SubjectStatus.APROBADA ||
      record.status === SubjectStatus.REGULARIZADA
    );
  }

  private getAttemptCount(notes: string | null): number {
    if (!notes) {
      return 1;
    }

    const lowered = notes.toLowerCase();
    const attemptMatch = lowered.match(/intento\s*(\d+)/);
    if (attemptMatch) {
      return Number(attemptMatch[1]);
    }

    if (lowered.includes('reintento') || lowered.includes('recurs') || lowered.includes('retry')) {
      return 2;
    }

    return 1;
  }
}
