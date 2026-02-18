import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubjectNodeDto } from '../dto/subject-node.dto';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import { getYearInfo } from '../../../common/constants/subject-years';
import { UpdateSubjectRecordDto } from '../dto/update-subject-record.dto';
import type { SubjectWithRecords } from '../types/subject-with-records.type';
import { buildApprovalSets, resolveSubjectStatus } from '../helpers';

@Injectable()
export class AcademicCareerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async getCareerGraph(userEmail: string): Promise<SubjectNodeDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const userId = user.id;

    const subjects = await this.prisma.subject.findMany({
      select: {
        id: true,
        planCode: true,
        name: true,
        year: true,
        hours: true,
        isOptional: true,
        prerequisites: {
          select: {
            condition: true,
            prerequisiteId: true,
            prerequisite: {
              select: { planCode: true },
            },
          },
        },
        records: {
          where: { userId },
          select: {
            status: true,
            finalGrade: true,
            difficulty: true,
            statusDate: true,
            notes: true,
          },
        },
      },
      orderBy: { year: 'asc' },
    });

    const typedSubjects = subjects as SubjectWithRecords[];
    const { finalApprovedIds, regularApprovedIds } =
      buildApprovalSets(typedSubjects);

    return typedSubjects.map((subject) => {
      const record = subject.records[0];
      const status = resolveSubjectStatus(
        subject,
        finalApprovedIds,
        regularApprovedIds,
      );

      const requiredIds = subject.prerequisites.map(
        (p) => p.prerequisite.planCode,
      );

      const yearInfo = getYearInfo(subject.planCode);

      return new SubjectNodeDto({
        id: subject.id,
        planCode: subject.planCode,
        name: subject.name,
        year: subject.year,
        hours: subject.hours,
        isOptional: subject.isOptional,
        status: status,
        grade: record?.finalGrade ?? null,
        difficulty: record?.difficulty ?? null,
        statusDate: record?.statusDate
          ? record.statusDate.toISOString().slice(0, 10)
          : null,
        notes: record?.notes ?? null,
        correlativeIds: requiredIds,
        isIntermediateDegree: yearInfo.isIntermediateDegree,
      });
    });
  }

  async updateSubjectRecord(
    userEmail: string,
    subjectId: string,
    payload: UpdateSubjectRecordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new NotFoundException('Materia no encontrada.');
    }

    if (payload.status === SubjectStatus.DISPONIBLE) {
      throw new BadRequestException(
        'El estado DISPONIBLE se calcula automaticamente.',
      );
    }

    if (payload.status === SubjectStatus.APROBADA && payload.grade === null) {
      throw new BadRequestException(
        'Una materia aprobada requiere nota final.',
      );
    }

    if (payload.status !== SubjectStatus.APROBADA && payload.grade !== null) {
      throw new BadRequestException(
        'Solo una materia aprobada puede tener nota final.',
      );
    }

    if (payload.status === SubjectStatus.PENDIENTE && payload.notes) {
      this.logger.warn('Se guardan comentarios en materias pendientes.');
    }

    const statusDateValue = payload.statusDate ?? null;

    return this.prisma.academicRecord.upsert({
      where: {
        userId_subjectId: {
          userId: user.id,
          subjectId,
        },
      },
      create: {
        userId: user.id,
        subjectId,
        status: payload.status,
        finalGrade: payload.grade ?? null,
        difficulty: payload.difficulty ?? null,
        statusDate: statusDateValue,
        notes: payload.notes ?? null,
      },
      update: {
        status: payload.status,
        finalGrade: payload.grade ?? null,
        difficulty: payload.difficulty ?? null,
        statusDate: statusDateValue,
        notes: payload.notes ?? null,
      },
    });
  }
}
