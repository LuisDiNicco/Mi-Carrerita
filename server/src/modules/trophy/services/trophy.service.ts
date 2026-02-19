import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrophyCaseDto, TrophyDto, TrophyCheckResultDto } from '../dto';
import {
  TrophyTier,
  TROPHY_TIER_WEIGHTS,
} from '../../../common/constants/trophy-enums';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import {
  TROPHY_DEFINITIONS,
  getTrophiesByTier,
} from '../helpers/trophy-definitions';

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
    // Check if trophies already exist
    const existingCount = await this.prisma.trophy.count();
    if (existingCount > 0) {
      return; // Already seeded
    }

    for (const def of TROPHY_DEFINITIONS) {
      await this.prisma.trophy.create({
        data: {
          code: def.code,
          name: def.name,
          description: def.description,
          tier: def.tier,
          icon: def.icon,
          rarity: def.rarity,
          criteria: def.criteria,
        },
      });
    }

    this.logger.log(`Seeded ${TROPHY_DEFINITIONS.length} trophies`);
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

    const newlyUnlocked: TrophyDto[] = [];

    // Evaluate all trophies
    for (const definition of TROPHY_DEFINITIONS) {
      const isUnlocked = await this.evaluateTrophyCriteria(
        definition.code,
        user.id,
      );

      // Check if already unlocked
      const existing = await this.prisma.userTrophy.findUnique({
        where: {
          userId_trophyId: {
            userId: user.id,
            trophyId: (await this.prisma.trophy.findUnique({
              where: { code: definition.code },
              select: { id: true },
            }))!.id,
          },
        },
      });

      if (isUnlocked && !existing?.unlockedAt) {
        // Unlock trophy
        const trophyRecord = await this.prisma.trophy.findUnique({
          where: { code: definition.code },
        });

        if (trophyRecord) {
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
    const byTier = {
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
      byTier: byTier as any,
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
    userId: string,
  ): Promise<boolean> {
    // Get user's academic records
    const records = await this.prisma.academicRecord.findMany({
      where: { userId },
      include: { subject: true },
    });

    const completedSubjects = records.filter(
      (r) =>
        r.status === SubjectStatus.APROBADA ||
        r.status === SubjectStatus.REGULARIZADA,
    );

    const totalSubjects = await this.prisma.subject.count();
    const completionPercentage =
      (completedSubjects.length / totalSubjects) * 100;

    // Define criteria evaluation
    const criteriaMap: Record<string, boolean> = {
      FIRST_SUBJECT_COMPLETED: completedSubjects.length >= 1,
      THREE_SUBJECT_STREAK: completedSubjects.length >= 3,
      PERFECT_SCORE_100: records.some((r) => r.finalGrade === 100),
      COMEBACK_PASS: false, // TODO: Complex logic (retries)
      DIFFICULT_SUBJECT_PASSED: completedSubjects.some(
        (r) => r.difficulty! >= 8,
      ),
      ALL_OPTIONALS_COMPLETED: this.checkAllOptionalsCompleted(records),
      SEMESTER_AVERAGE_90: this.checkSemesterAverage90(records),
      YEAR_NO_FAILURES: this.checkYearNoFailures(records),
      TEN_SUBJECTS_PASSED: completedSubjects.length >= 10,
      EARLY_BIRD: false, // TODO: Date comparison logic
      CONSISTENCY_BRONZE: this.checkConsistency(records, 5),
      AVERAGE_80_OVERALL: this.checkOverallAverage(records, 80),
      MIXED_STATUS_PASS: this.checkMixedStatus(records),
      SUBJECT_RETRY_SUCCESS: false, // TODO: Retry logic
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
      SPEED_RUNNER: false, // TODO: Time-based logic
      FLAWLESS_EXECUTION: completedSubjects.length >= totalSubjects * 0.9,
      CONSISTENT_EXCELLENCE: this.checkConsistentExcellence(records),
      CHALLENGE_ACCEPTED: false, // TODO: Top 5 hardest
      MARATHON_CHAMPION: this.checkHoursCompleted(records, 200),

      // PLATINUM
      LEGEND:
        completionPercentage >= 100 &&
        this.checkOverallAverage(records, 90) &&
        records.filter((r) => r.status !== SubjectStatus.APROBADA).length === 0,
    };

    return criteriaMap[code] ?? false;
  }

  // Helper methods for complex criteria evaluation

  private checkAllOptionalsCompleted(records: any[]): boolean {
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

  private checkSemesterAverage90(records: any[]): boolean {
    // Simplified: check if any record has a grade >= 90
    return records.some((r) => r.finalGrade && r.finalGrade >= 90);
  }

  private checkYearNoFailures(records: any[]): boolean {
    // TODO: Group by year and check pass rate per year
    return true;
  }

  private checkConsistency(records: any[], minSemesters: number): boolean {
    // TODO: Group by semester and count semesters with at least 1 pass
    return (
      records.filter((r) => r.status === SubjectStatus.APROBADA).length >=
      minSemesters
    );
  }

  private checkOverallAverage(records: any[], threshold: number): boolean {
    const grades = records
      .filter((r) => r.finalGrade !== null)
      .map((r) => r.finalGrade);
    if (grades.length === 0) return false;
    const average = grades.reduce((a, b) => a + b, 0) / grades.length;
    return average >= threshold;
  }

  private checkMixedStatus(records: any[]): boolean {
    const hasRegularized = records.some(
      (r) => r.status === SubjectStatus.REGULARIZADA,
    );
    const hasFinal = records.some((r) => r.status === SubjectStatus.APROBADA);
    return hasRegularized && hasFinal;
  }

  private checkHoursCompleted(records: any[], minHours: number): boolean {
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
    records: any[],
    minSemesters: number,
  ): boolean {
    // TODO: Group by semester and check consecutive clean semesters
    return true;
  }

  private checkIntermediateDegree(records: any[]): boolean {
    // TODO: Check if intermediate degree is completed
    return true;
  }

  private checkPerfectSemester(records: any[]): boolean {
    // TODO: Check for a semester with all subjects passed and avg 90+
    return true;
  }

  private checkQuickProgress(records: any[]): boolean {
    // TODO: Check if 15+ hours completed in one semester
    return true;
  }

  private checkConsistentExcellence(records: any[]): boolean {
    // TODO: Check if 80% of semesters have average 85+
    return true;
  }
}
