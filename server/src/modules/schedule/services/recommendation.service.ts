import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TimePeriod } from '../../../common/constants/schedule-enums';
import {
  RecommendationResultDto,
  RecommendedSubjectDto,
  UpdateRecommendationStatusDto,
  ConflictDto,
} from '../dto';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import { detectConflicts, TimetableCheck } from '../helpers/schedule.helpers';
import { DAY_LABELS } from '../../../common/constants/schedule-enums';
import {
  TimetableWithSubject,
  RecommendedSubjectWithSubject,
} from '../../../shared/types/database.types';

@Injectable()
export class RecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  /**
   * Generate recommendations for next subjects to take
   * Returns subjects without conflicts based on user's scheduled timetables
   */
  async generateRecommendation(
    userEmail: string,
  ): Promise<RecommendationResultDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Get user's completed subjects
    const completedRecords = await this.prisma.academicRecord.findMany({
      where: {
        userId: user.id,
        status: { in: [SubjectStatus.APROBADA, SubjectStatus.REGULARIZADA] },
      },
      select: { subjectId: true },
    });

    const completedSubjectIds = new Set(
      completedRecords.map((r) => r.subjectId),
    );

    // Get all subjects
    const allSubjects = await this.prisma.subject.findMany({
      include: {
        prerequisites: {
          select: {
            prerequisite: { select: { id: true, name: true } },
            condition: true,
          },
        },
      },
    });

    // Filter available subjects (not yet completed)
    const availableSubjects = allSubjects.filter(
      (s) => !completedSubjectIds.has(s.id),
    );

    // Get user's current timetables
    const userTimetables = await this.prisma.timetable.findMany({
      where: { userId: user.id },
      include: { subject: true },
    });

    const timetableChecks: TimetableCheck[] = userTimetables.map((t) => ({
      subjectId: t.subjectId,
      subjectName: t.subject.name,
      planCode: t.subject.planCode,
      period: t.period,
      dayOfWeek: t.dayOfWeek,
    }));

    // Get existing recommendations
    const existingRecommendations =
      await this.prisma.recommendedSubject.findMany({
        where: { userId: user.id },
      });

    const recommendationMap = new Map(
      existingRecommendations.map((r) => [r.subjectId, r]),
    );

    // Build recommendation result
    const recommendedSubjects: RecommendedSubjectDto[] = [];
    const conflicts: ConflictDto[] = [];

    for (const subject of availableSubjects) {
      const existingRec = recommendationMap.get(subject.id);
      const status = existingRec?.status || 'SUGGESTED';

      // If MANTENIDA, check for conflicts with timetables
      if (existingRec?.status === 'MANTENIDA') {
        // For MANTENIDA subjects, they should have timetables
        const subjectTimetables = userTimetables.filter(
          (t) => t.subjectId === subject.id,
        );

        // Check for conflicts with other MANTENIDA subjects
        const conflictingTimetables = subjectTimetables.flatMap((st) => {
          return userTimetables
            .filter(
              (ot) =>
                ot.subjectId !== subject.id &&
                ot.dayOfWeek === st.dayOfWeek &&
                ot.period === st.period,
            )
            .map((ot) => ({
              subject1Id: subject.id,
              subject1Name: subject.name,
              subject2Id: ot.subjectId,
              subject2Name: ot.subject.name,
              period: st.period,
              dayOfWeek: st.dayOfWeek,
              dayLabel: DAY_LABELS[st.dayOfWeek],
            }));
        });

        conflicts.push(...conflictingTimetables);
      }

      recommendedSubjects.push({
        id: existingRec?.id || '',
        subjectId: subject.id,
        subjectName: subject.name,
        planCode: subject.planCode,
        year: subject.year,
        hours: subject.hours,
        status: status as 'SUGGESTED' | 'MANTENIDA' | 'DELETED',
        timetables:
          status === 'MANTENIDA'
            ? userTimetables
                .filter((t) => t.subjectId === subject.id)
                .map((t) => ({
                  id: t.id,
                  subjectId: t.subjectId,
                  subjectName: t.subject.name,
                  planCode: t.subject.planCode,
                  period: t.period as TimePeriod,
                  dayOfWeek: t.dayOfWeek,
                  dayLabel: DAY_LABELS[t.dayOfWeek],
                }))
            : undefined,
      });
    }

    return {
      recommendedSubjects,
      conflicts: conflicts.length > 0 ? conflicts : [],
      hasConflicts: conflicts.length > 0,
    };
  }

  /**
   * Update recommendation status (SUGGESTED → MANTENIDA → DELETED)
   */
  async updateRecommendationStatus(
    userEmail: string,
    update: UpdateRecommendationStatusDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: update.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada.');
    }

    if (update.status === 'MANTENIDA' && !update.timetable) {
      throw new BadRequestException(
        'Se requiere al menos un horario para marcar como MANTENIDA',
      );
    }

    // Upsert recommendation
    const recommendation = await this.prisma.recommendedSubject.upsert({
      where: {
        userId_subjectId: {
          userId: user.id,
          subjectId: update.subjectId,
        },
      },
      create: {
        userId: user.id,
        subjectId: update.subjectId,
        status: update.status,
        takenAt: update.status === 'MANTENIDA' ? new Date() : null,
      },
      update: {
        status: update.status,
        takenAt: update.status === 'MANTENIDA' ? new Date() : null,
      },
    });

    // If MANTENIDA with timetable, add it
    if (update.status === 'MANTENIDA' && update.timetable) {
      await this.prisma.timetable.upsert({
        where: {
          userId_subjectId_period_dayOfWeek: {
            userId: user.id,
            subjectId: update.subjectId,
            period: update.timetable.period,
            dayOfWeek: update.timetable.dayOfWeek,
          },
        },
        create: {
          userId: user.id,
          subjectId: update.subjectId,
          period: update.timetable.period,
          dayOfWeek: update.timetable.dayOfWeek,
        },
        update: {},
      });
    } else if (update.status === 'DELETED') {
      // Delete all timetables for this subject
      await this.prisma.timetable.deleteMany({
        where: {
          userId: user.id,
          subjectId: update.subjectId,
        },
      });
    }
  }

  /**
   * Get current recommendations for user
   */
  async getRecommendations(
    userEmail: string,
  ): Promise<RecommendationResultDto> {
    return this.generateRecommendation(userEmail);
  }
}
