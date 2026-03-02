import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrophyCaseDto, TrophyDto } from '../dto';
import { TrophyTier } from '../../../common/constants/trophy-enums';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import {
  TROPHY_DEFINITIONS,
  getTrophiesByTier,
} from '../helpers/trophy-definitions';
import {
  AcademicRecordWithSubject,
  TrophyEvaluationContext,
} from '../types/trophy.types';
import { TrophyEvaluator } from '../evaluators/base.evaluator';
import {
  AverageEvaluator,
  CompletionEvaluator,
  HoursEvaluator,
  ConsistencyEvaluator,
  ChallengeEvaluator,
  CountEvaluator,
} from '../evaluators';

@Injectable()
export class TrophyService implements OnModuleInit {
  private evaluators: TrophyEvaluator[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    average: AverageEvaluator,
    completion: CompletionEvaluator,
    hours: HoursEvaluator,
    consistency: ConsistencyEvaluator,
    challenge: ChallengeEvaluator,
    count: CountEvaluator,
  ) {
    this.evaluators = [average, completion, hours, consistency, challenge, count];
  }

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
    const userTrophyById = new Map(userTrophies.map((t) => [t.trophyId, t]));

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

        newlyUnlocked.push(TrophyDto.fromEntity(trophyRecord, { unlockedAt: new Date(), progress: 100 }));
      }
    }

    return newlyUnlocked;
  }

  /**
   * Listen to academic record updates to automatically check trophies
   */
  @OnEvent('subject.status.updated', { async: true })
  async handleSubjectStatusUpdated(payload: { userEmail: string }) {
    try {
      this.logger.log(`Evaluating trophies for user ${payload.userEmail}`);
      const unlocked = await this.checkAndUnlockTrophies(payload.userEmail);
      if (unlocked.length > 0) {
        this.logger.log(
          `User ${payload.userEmail} unlocked ${unlocked.length} new trophies.`,
        );
      }
    } catch (err: unknown) {
      this.logger.error(`Error checking trophies on event: ${err instanceof Error ? err.message : String(err)}`);
    }
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
      return TrophyDto.fromEntity(t, userStatus);
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
    return TrophyDto.fromEntity(trophy, userStatus);
  }

  /**
   * Internal: Evaluate trophy unlock criteria
   */
  private async evaluateTrophyCriteria(
    code: string,
    context: TrophyEvaluationContext,
  ): Promise<boolean> {
    const evaluator = this.evaluators.find(e => e.supportedCodes.includes(code));
    if (!evaluator) {
      this.logger.warn(`No evaluator found for trophy ${code}`);
      return false;
    }
    return evaluator.evaluate(code, context);
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
}
