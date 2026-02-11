import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  private buildApprovedSets(subjects: SubjectWithRecords[]) {
    const finalApprovedIds = new Set<string>();
    const regularApprovedIds = new Set<string>();

    subjects.forEach((subject) => {
      const record = subject.records[0];
      if (!record || !isSubjectStatus(record.status)) return;

      if (record.status === SubjectStatus.APROBADA) {
        finalApprovedIds.add(subject.id);
        regularApprovedIds.add(subject.id);
        return;
      }

      if (record.status === SubjectStatus.REGULARIZADA) {
        regularApprovedIds.add(subject.id);
      }
    });

    return { finalApprovedIds, regularApprovedIds };
  }

  private resolveSubjectStatus(
    subject: SubjectWithRecords,
    finalApprovedIds: Set<string>,
    regularApprovedIds: Set<string>,
  ) {
    const record = subject.records[0];

    let status: SubjectStatus = SubjectStatus.PENDIENTE;

    if (record && isSubjectStatus(record.status)) {
      status = record.status;
    }

    if (status !== SubjectStatus.PENDIENTE) {
      return status;
    }

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

    return meetsAllPrerequisites ? SubjectStatus.DISPONIBLE : status;
  }

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

    const typedSubjects = subjects as SubjectWithRecords[];
    const { finalApprovedIds, regularApprovedIds } =
      this.buildApprovedSets(typedSubjects);

    return typedSubjects.map((subject) => {
      const record = subject.records[0];
      const status = this.resolveSubjectStatus(
        subject,
        finalApprovedIds,
        regularApprovedIds,
      );

      const requiredIds = subject.prerequisites.map(
        (p) => p.prerequisite.planCode,
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

type SubjectWithRecords = Prisma.SubjectGetPayload<{
  select: {
    id: true;
    planCode: true;
    name: true;
    semester: true;
    credits: true;
    isOptional: true;
    prerequisites: {
      select: {
        condition: true;
        prerequisiteId: true;
        prerequisite: {
          select: { planCode: true };
        };
      };
    };
    records: {
      select: {
        status: true;
        finalGrade: true;
        difficulty: true;
        statusDate: true;
        notes: true;
      };
    };
  };
}>;
