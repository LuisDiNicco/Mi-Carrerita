import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AcademicHistoryFilterDto,
  EditAcademicRecordDto,
  AcademicHistoryRowDto,
  AcademicHistoryPageDto,
} from '../dto';
import {
  buildWhereClause,
  buildSubjectWhereClause,
  buildOrderByClause,
  inferSemesterFromDate,
} from '../helpers/history.helpers';

@Injectable()
export class AcademicHistoryService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Query total count
    const total = await this.prisma.academicRecord.count({
      where: whereRecord,
    });

    // Query records
    const records = await this.prisma.academicRecord.findMany({
      where: {
        ...whereRecord,
        subject:
          whereSubject && Object.keys(whereSubject).length > 0
            ? whereSubject
            : undefined,
      },
      include: { subject: true },
      orderBy,
      skip,
      take: limit,
    });

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
    if (update.status === 'DISPONIBLE') {
      throw new BadRequestException(
        'El estado DISPONIBLE se calcula automáticamente.',
      );
    }

    if (update.status === 'APROBADA' && update.finalGrade === undefined) {
      throw new BadRequestException(
        'Una materia aprobada requiere nota final.',
      );
    }

    if (update.status !== 'APROBADA' && update.finalGrade !== undefined) {
      throw new BadRequestException(
        'Solo una materia aprobada puede tener nota final.',
      );
    }

    // Update record
    const updated = await this.prisma.academicRecord.update({
      where: { id: recordId },
      data: {
        status: update.status,
        finalGrade: update.finalGrade ?? null,
        difficulty: update.difficulty ?? null,
        notes: update.notes ?? null,
        isIntermediate: update.isIntermediate ?? false,
        statusDate: update.statusDate ? new Date(update.statusDate) : null,
      },
      include: { subject: true },
    });

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
  }

  /**
   * Internal helper: map record to DTO
   */
  private mapToAcademicHistoryRowDto(record: any): AcademicHistoryRowDto {
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
