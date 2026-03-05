import {
  validateAcademicRecord,
  parseIsolatedDate,
} from '../../../common/helpers/academic-validation.helper';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AcademicHistoryFilterDto,
  EditAcademicRecordDto,
  AcademicHistoryRowDto,
  AcademicHistoryPageDto,
  BatchAcademicRecordDto,
} from '../dto';
import {
  buildWhereClause,
  buildSubjectWhereClause,
  buildOrderByClause,
  inferSemesterFromDate,
} from '../helpers/history.helpers';
import { SubjectStatus } from '../../../common/constants/academic-enums';

const ELECTIVE_SOURCE_PLAN_CODES = ['3599', '3677', '3678', '3679'];
const ELECTIVE_TARGET_PLAN_CODES = ['3672', '3673', '3674'];
const ELECTIVE_COMPLETION_STATUSES = new Set<string>([
  SubjectStatus.APROBADA,
  SubjectStatus.EQUIVALENCIA,
]);

@Injectable()
export class AcademicHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private readonly recordWithSubjectSelect =
    Prisma.validator<Prisma.AcademicRecordDefaultArgs>()({
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            planCode: true,
            year: true,
            hours: true,
            isOptional: true,
          },
        },
      },
    });

  /**
   * Get paginated and filtered academic history
   */
  async getHistory(
    userEmail: string,
    filter: AcademicHistoryFilterDto,
  ): Promise<AcademicHistoryPageDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Build filter clauses
    const whereRecord = buildWhereClause(user.id, filter);
    const whereSubject = buildSubjectWhereClause(filter);
    const orderBy = buildOrderByClause(filter.sortBy);

    // Calculate pagination
    const limit = filter.limit || 50;
    const page = Math.max(1, filter.page || 1);
    const skip = (page - 1) * limit;

    const recordWhere: Prisma.AcademicRecordWhereInput = {
      ...whereRecord,
      subject:
        whereSubject && Object.keys(whereSubject).length > 0
          ? whereSubject
          : undefined,
    };

    const [total, records] = await this.prisma.$transaction([
      this.prisma.academicRecord.count({ where: recordWhere }),
      this.prisma.academicRecord.findMany({
        where: recordWhere,
        ...this.recordWithSubjectSelect,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // Map to DTOs
    const data = records.map((r) => this.mapToAcademicHistoryRowDto(r));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Batch update or insert multiple records safely
   */
  async batchUpdateRecords(
    userEmail: string,
    records: BatchAcademicRecordDto[],
  ): Promise<{ count: number }> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    let updatedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const record of records) {
        // Encontrar la materia por código de plan
        const subject = await tx.subject.findUnique({
          where: { planCode: record.planCode },
        });

        if (!subject) continue; // Skip if it doesn't exist in our DB

        const existingRecord = await tx.academicRecord.findUnique({
          where: {
            userId_subjectId: {
              userId: user.id,
              subjectId: subject.id,
            },
          },
        });

        if (existingRecord) {
          await tx.academicRecord.update({
            where: { id: existingRecord.id },
            data: {
              status: record.status,
              finalGrade: record.finalGrade ?? null,
              statusDate: record.statusDate
                ? parseIsolatedDate(record.statusDate)
                : null,
            },
          });
        } else {
          await tx.academicRecord.create({
            data: {
              userId: user.id,
              subjectId: subject.id,
              status: record.status,
              finalGrade: record.finalGrade ?? null,
              statusDate: record.statusDate
                ? parseIsolatedDate(record.statusDate)
                : null,
            },
          });
        }
        updatedCount++;
      }

      await this.syncElectiveEquivalences(tx, user.id);
    });

    this.eventEmitter.emit('subject.status.updated', { userEmail });
    return { count: updatedCount };
  }

  private async syncElectiveEquivalences(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    const sourceSubjects = await tx.subject.findMany({
      where: { planCode: { in: ELECTIVE_SOURCE_PLAN_CODES } },
      select: { id: true },
    });

    if (sourceSubjects.length === 0) return;

    const sourceRecords = await tx.academicRecord.findMany({
      where: {
        userId,
        subjectId: { in: sourceSubjects.map((subject) => subject.id) },
      },
      select: {
        status: true,
        statusDate: true,
      },
    });

    const approvedSourceCount = sourceRecords.filter((record) =>
      ELECTIVE_COMPLETION_STATUSES.has(record.status),
    ).length;

    if (approvedSourceCount === 0) return;

    const targetSubjects = await tx.subject.findMany({
      where: { planCode: { in: ELECTIVE_TARGET_PLAN_CODES } },
      select: { id: true, planCode: true },
    });

    const targetSubjectByCode = new Map(
      targetSubjects.map((subject) => [subject.planCode, subject.id]),
    );

    const firstStatusDate = sourceRecords
      .filter((record) => ELECTIVE_COMPLETION_STATUSES.has(record.status))
      .map((record) => record.statusDate)
      .filter((date): date is Date => Boolean(date))
      .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

    const targetToApproveCount = Math.min(
      approvedSourceCount,
      ELECTIVE_TARGET_PLAN_CODES.length,
    );

    for (let index = 0; index < targetToApproveCount; index += 1) {
      const planCode = ELECTIVE_TARGET_PLAN_CODES[index];
      const targetSubjectId = targetSubjectByCode.get(planCode);
      if (!targetSubjectId) continue;

      await tx.academicRecord.upsert({
        where: {
          userId_subjectId: {
            userId,
            subjectId: targetSubjectId,
          },
        },
        create: {
          userId,
          subjectId: targetSubjectId,
          status: SubjectStatus.APROBADA,
          finalGrade: null,
          statusDate: firstStatusDate,
        },
        update: {
          status: SubjectStatus.APROBADA,
          statusDate: firstStatusDate,
        },
      });
    }
  }

  /**
   * Update a single academic record
   */
  async updateRecord(
    userEmail: string,
    recordId: string,
    update: EditAcademicRecordDto,
  ): Promise<AcademicHistoryRowDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Verify user owns this record
    const record = await this.prisma.academicRecord.findUnique({
      where: { id: recordId },
      include: { subject: true },
    });

    if (!record) {
      throw new NotFoundException('Registro de materia no encontrado.');
    }

    if (record.userId !== user.id) {
      throw new ForbiddenException(
        'No tienes permiso para editar este registro.',
      );
    }

    // Validate before updating
    validateAcademicRecord({
      status: update.status,
      grade: update.finalGrade,
      notes: update.notes,
    });

    // Update record
    const updated = await this.prisma.academicRecord.update({
      where: { id: recordId },
      data: {
        status: update.status,
        finalGrade: update.finalGrade ?? null,
        difficulty: update.difficulty ?? null,
        notes: update.notes ?? null,
        isIntermediate: update.isIntermediate ?? record.isIntermediate,
        statusDate: update.statusDate
          ? parseIsolatedDate(update.statusDate)
          : null,
      },
      ...this.recordWithSubjectSelect,
    });

    this.eventEmitter.emit('subject.status.updated', { userEmail });

    return this.mapToAcademicHistoryRowDto(updated);
  }

  /**
   * Delete a single academic record
   */
  async deleteRecord(userEmail: string, recordId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Verify user owns this record
    const record = await this.prisma.academicRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Registro de materia no encontrado.');
    }

    if (record.userId !== user.id) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este registro.',
      );
    }

    await this.prisma.academicRecord.delete({
      where: { id: recordId },
    });

    this.eventEmitter.emit('subject.status.updated', { userEmail });
  }

  /**
   * Delete all academic records for a user
   */
  async deleteAll(userEmail: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    await this.prisma.academicRecord.deleteMany({
      where: { userId: user.id },
    });

    this.eventEmitter.emit('subject.status.updated', { userEmail });
  }

  /**
   * Internal helper: map record to DTO
   */
  private mapToAcademicHistoryRowDto(
    record: Prisma.AcademicRecordGetPayload<
      typeof this.recordWithSubjectSelect
    >,
  ): AcademicHistoryRowDto {
    const semester = inferSemesterFromDate(
      record.statusDate,
      record.subject.year,
    );

    return {
      id: record.id,
      subjectId: record.subjectId,
      subjectName: record.subject.name,
      planCode: record.subject.planCode,
      year: record.subject.year,
      semester,
      hours: record.subject.hours,
      status: record.status,
      finalGrade: record.finalGrade,
      difficulty: record.difficulty,
      notes: record.notes,
      statusDate: record.statusDate
        ? record.statusDate.toISOString().split('T')[0]
        : null,
      isIntermediate: record.isIntermediate,
    };
  }
}
