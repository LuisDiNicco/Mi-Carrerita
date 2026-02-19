import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTimetableDto, TimetableDto, ConflictDto } from '../dto';
import {
  detectConflicts,
  checkNewTimetableConflicts,
  isValidTimetable,
  TimetableCheck,
} from '../helpers/schedule.helpers';
import { DAY_LABELS } from '../../../common/constants/schedule-enums';
import { TimetableWithSubject } from '../../../shared/types/database.types';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create or update a timetable entry for a subject
   */
  async setTimetable(
    userEmail: string,
    dto: CreateTimetableDto,
  ): Promise<TimetableDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada.');
    }

    // Validate the timetable entry
    const validation = isValidTimetable({
      subjectId: dto.subjectId,
      subjectName: subject.name,
      planCode: subject.planCode,
      period: dto.period,
      dayOfWeek: dto.dayOfWeek,
    });

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // Check for conflicts with existing timetables
    const existingTimetables = await this.prisma.timetable.findMany({
      where: { userId: user.id },
      include: { subject: true },
    });

    const existingCheck: TimetableCheck[] = existingTimetables.map((t) => ({
      subjectId: t.subjectId,
      subjectName: t.subject.name,
      planCode: t.subject.planCode,
      period: t.period,
      dayOfWeek: t.dayOfWeek,
    }));

    const conflicts = checkNewTimetableConflicts(existingCheck, {
      subjectId: dto.subjectId,
      subjectName: subject.name,
      planCode: subject.planCode,
      period: dto.period,
      dayOfWeek: dto.dayOfWeek,
    });

    if (conflicts.length > 0) {
      throw new BadRequestException(
        `Conflicto de horario detectado con: ${conflicts
          .map((c) => c.subject2Name)
          .join(', ')}`,
      );
    }

    // Upsert timetable entry
    const timetableRecord = await this.prisma.timetable.upsert({
      where: {
        userId_subjectId_period_dayOfWeek: {
          userId: user.id,
          subjectId: dto.subjectId,
          period: dto.period,
          dayOfWeek: dto.dayOfWeek,
        },
      },
      create: {
        userId: user.id,
        subjectId: dto.subjectId,
        period: dto.period,
        dayOfWeek: dto.dayOfWeek,
      },
      update: {
        // If it already exists, just return it
      },
      include: { subject: true },
    });

    return this.mapToTimetableDto(timetableRecord);
  }

  /**
   * Set multiple timetable entries at once
   */
  /**
   * Set multiple timetable entries at once
   */
  async setMultipleTimetables(
    userEmail: string,
    dtos: CreateTimetableDto[],
  ): Promise<TimetableDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Wrap in transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      const results: TimetableDto[] = [];
      for (const dto of dtos) {
        // We need to pass the transaction client to setTimetable if we want it to be part of the transaction.
        // However, setTimetable uses this.prisma. To avoid refactoring everything,
        // we can implement the logic here or refactor setTimetable to accept an optional tx client.
        // A cleaner approach for this specific method without major refactoring:

        const subject = await tx.subject.findUnique({
          where: { id: dto.subjectId },
        });

        if (!subject) {
          throw new NotFoundException(`Materia no encontrada: ${dto.subjectId}`);
        }

        const validation = isValidTimetable({
          subjectId: dto.subjectId,
          subjectName: subject.name,
          planCode: subject.planCode,
          period: dto.period,
          dayOfWeek: dto.dayOfWeek,
        });

        if (!validation.valid) {
          throw new BadRequestException(validation.error);
        }

        // Check for conflicts with existing timetables (including ones we just added in this transaction!)
        const existingTimetables = await tx.timetable.findMany({
          where: { userId: user.id },
          include: { subject: true },
        });

        const existingCheck: TimetableCheck[] = existingTimetables.map((t) => ({
          subjectId: t.subjectId,
          subjectName: t.subject.name,
          planCode: t.subject.planCode,
          period: t.period,
          dayOfWeek: t.dayOfWeek,
        }));

        const conflicts = checkNewTimetableConflicts(existingCheck, {
          subjectId: dto.subjectId,
          subjectName: subject.name,
          planCode: subject.planCode,
          period: dto.period,
          dayOfWeek: dto.dayOfWeek,
        });

        if (conflicts.length > 0) {
          throw new BadRequestException(
            `Conflicto de horario detectado con: ${conflicts
              .map((c) => c.subject2Name)
              .join(', ')}`,
          );
        }

        const timetableRecord = await tx.timetable.upsert({
          where: {
            userId_subjectId_period_dayOfWeek: {
              userId: user.id,
              subjectId: dto.subjectId,
              period: dto.period,
              dayOfWeek: dto.dayOfWeek,
            },
          },
          create: {
            userId: user.id,
            subjectId: dto.subjectId,
            period: dto.period,
            dayOfWeek: dto.dayOfWeek,
          },
          update: {},
          include: { subject: true },
        });

        results.push(this.mapToTimetableDto(timetableRecord));
      }
      return results;
    });
  }

  /**
   * Get all timetable entries for a user
   */
  async getTimetables(userEmail: string): Promise<TimetableDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const timetables = await this.prisma.timetable.findMany({
      where: { userId: user.id },
      include: { subject: true },
    });

    return timetables.map((t) => this.mapToTimetableDto(t));
  }

  /**
   * Delete a timetable entry
   */
  async deleteTimetable(userEmail: string, subjectId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    await this.prisma.timetable.deleteMany({
      where: { userId: user.id, subjectId },
    });
  }

  /**
   * Check for conflicts in current schedule
   */
  async checkConflicts(userEmail: string): Promise<ConflictDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const timetables = await this.prisma.timetable.findMany({
      where: { userId: user.id },
      include: { subject: true },
    });

    const checks: TimetableCheck[] = timetables.map((t) => ({
      subjectId: t.subjectId,
      subjectName: t.subject.name,
      planCode: t.subject.planCode,
      period: t.period,
      dayOfWeek: t.dayOfWeek,
    }));

    return detectConflicts(checks);
  }

  /**
   * Internal helper: map Timetable record to DTO
   */
  private mapToTimetableDto(record: TimetableWithSubject): TimetableDto {
    return {
      id: record.id,
      subjectId: record.subjectId,
      subjectName: record.subject.name,
      planCode: record.subject.planCode,
      period: record.period,
      dayOfWeek: record.dayOfWeek,
      dayLabel: DAY_LABELS[record.dayOfWeek] || `Day ${record.dayOfWeek}`,
    };
  }
}
