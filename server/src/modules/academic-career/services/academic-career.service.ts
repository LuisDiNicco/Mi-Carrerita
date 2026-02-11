import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubjectNodeDto } from '../dto/subject-node.dto';
import {
  SubjectStatus,
  CorrelativityCondition,
  isSubjectStatus,
} from '../../../common/constants/academic-enums';
import { UpdateSubjectRecordDto } from '../dto/update-subject-record.dto';

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

    const subjects: any = await this.prisma.subject.findMany({
      select: {
        id: true,
        planCode: true,
        name: true,
        semester: true,
        credits: true,
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
      orderBy: { semester: 'asc' },
    });

    const finalApprovedIds = new Set<string>();
    const regularApprovedIds = new Set<string>();

    subjects.forEach((sub: any) => {
      const record = sub.records[0];
      if (record) {
        if (isSubjectStatus(record.status)) {
          if (record.status === SubjectStatus.APROBADA) {
            finalApprovedIds.add(sub.id);
            regularApprovedIds.add(sub.id);
          } else if (record.status === SubjectStatus.REGULARIZADA) {
            regularApprovedIds.add(sub.id);
          }
        }
      }
    });

    return subjects.map((subject: any) => {
      const record = subject.records[0];

      let status: SubjectStatus = SubjectStatus.PENDIENTE;

      if (record && isSubjectStatus(record.status)) {
        status = record.status;
      }

      if (status === SubjectStatus.PENDIENTE) {
        let meetsAllPrerequisites = true;

        for (const req of subject.prerequisites) {
          const prereqId = req.prerequisiteId;

          if (req.condition === CorrelativityCondition.FINAL_APROBADO) {
            if (!finalApprovedIds.has(prereqId)) {
              meetsAllPrerequisites = false;
              break;
            }
          } else if (req.condition === CorrelativityCondition.REGULAR_CURSADA) {
            if (!regularApprovedIds.has(prereqId)) {
              meetsAllPrerequisites = false;
              break;
            }
          }
        }

        if (meetsAllPrerequisites) {
          status = SubjectStatus.DISPONIBLE;
        }
      }

      const requiredIds = subject.prerequisites.map(
        (p: any) => p.prerequisite.planCode,
      );

      return new SubjectNodeDto({
        id: subject.id,
        planCode: subject.planCode,
        name: subject.name,
        semester: subject.semester,
        credits: subject.credits,
        isOptional: subject.isOptional,
        status: status,
        grade: record?.finalGrade ?? null,
        difficulty: record?.difficulty ?? null,
        statusDate: record?.statusDate
          ? record.statusDate.toISOString().slice(0, 10)
          : null,
        notes: record?.notes ?? null,
        requiredSubjectIds: requiredIds,
      });
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
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

    if (payload.difficulty !== null && payload.difficulty !== undefined) {
      if (payload.difficulty < 1 || payload.difficulty > 100) {
        throw new BadRequestException(
          'La dificultad debe estar entre 1 y 100.',
        );
      }
    }

    const statusDateValue = payload.statusDate
      ? new Date(payload.statusDate)
      : null;

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
