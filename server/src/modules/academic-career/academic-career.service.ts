import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectNodeDto } from './dto/subject-node.dto';
// IMPORTAMOS DESDE NUESTRO ARCHIVO MANUAL
import { SubjectStatus, CorrelativityCondition } from '../../common/constants/academic-enums';
import { UpdateSubjectRecordDto } from './dto/update-subject-record.dto';

@Injectable()
export class AcademicCareerService {
  private readonly logger = new Logger(AcademicCareerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCareerGraph(userId: string): Promise<SubjectNodeDto[]> {
    try {
      const subjects = await this.prisma.subject.findMany({
        include: {
          prerequisites: {
            include: {
              prerequisite: true, 
            },
          },
          records: {
            where: { userId },
            select: {
              id: true,
              userId: true,
              subjectId: true,
              status: true,
              finalGrade: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { semester: 'asc' },
      });

      const finalApprovedIds = new Set<string>();
      const regularApprovedIds = new Set<string>();

      subjects.forEach((sub) => {
        const record = sub.records[0];
        
        if (record) {
          // Prisma devuelve record.status como string. Comparamos contra el valor del Enum.
          if (record.status === SubjectStatus.APROBADA) {
            finalApprovedIds.add(sub.id);
            regularApprovedIds.add(sub.id); 
          } else if (record.status === SubjectStatus.REGULARIZADA) {
            regularApprovedIds.add(sub.id);
          }
        }
      });

      return subjects.map((subject) => {
        const record = subject.records[0];
        // Aquí forzamos el tipado para TypeScript porque sabemos que la DB tiene valores válidos
        // O usamos un valor por defecto seguro.
        let status = record 
          ? (record.status as SubjectStatus) 
          : SubjectStatus.PENDIENTE;
        
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
          (p) => p.prerequisite.planCode,
        );

        return new SubjectNodeDto({
          id: subject.id,
          planCode: subject.planCode,
          name: subject.name,
          semester: subject.semester,
          credits: subject.credits,
          status: status, 
          grade: record?.finalGrade ?? null,
          statusDate: record?.updatedAt ? record.updatedAt.toISOString().slice(0, 10) : null,
          requiredSubjectIds: requiredIds,
        });
      });

    } catch (error) {
      this.logger.error(`Error generating career graph for user ${userId}`, error);
      throw error;
    }
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateSubjectRecord(
    userId: string,
    subjectId: string,
    payload: UpdateSubjectRecordDto,
  ) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada.');
    }

    if (payload.status === SubjectStatus.DISPONIBLE) {
      throw new BadRequestException('El estado DISPONIBLE se calcula automaticamente.');
    }

    const statusDateValue = payload.statusDate ? new Date(payload.statusDate) : null;

    return this.prisma.academicRecord.upsert({
      where: {
        userId_subjectId: {
          userId,
          subjectId,
        },
      },
      create: {
        userId,
        subjectId,
        status: payload.status,
        finalGrade: payload.grade ?? null,
      },
      update: {
        status: payload.status,
        finalGrade: payload.grade ?? null,
      },
    });
  }
}