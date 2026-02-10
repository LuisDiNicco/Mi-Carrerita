import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectNodeDto } from './dto/subject-node.dto';
import { SubjectStatus, CorrelativityCondition, isSubjectStatus } from '../../common/constants/academic-enums';
import { UpdateSubjectRecordDto } from './dto/update-subject-record.dto';

@Injectable()
export class AcademicCareerService {
  // Punto 8: Logger instanciado como propiedad readonly, estándar en NestJS.
  private readonly logger = new Logger(AcademicCareerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCareerGraph(userEmail: string): Promise<SubjectNodeDto[]> {
    // Primero obtenemos el ID del usuario basado en el email (que viene del Guard)
    const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
    });

    if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
    }
    
    const userId = user.id;

    // Punto 5: Optimización con 'select' para traer solo datos necesarios
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
              select: { planCode: true }
            }
          }
        },
        records: {
          where: { userId },
          select: {
            status: true, // Prisma devuelve esto como string
            finalGrade: true,
          },
        },
      },
      orderBy: { semester: 'asc' },
    });

    const finalApprovedIds = new Set<string>();
    const regularApprovedIds = new Set<string>();

    // Primera pasada: Determinar estados base
    subjects.forEach((sub) => {
      const record = sub.records[0];
      if (record) {
        // Punto 7: Uso del Type Guard y validación estricta
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

    return subjects.map((subject) => {
      const record = subject.records[0];
      
      // Punto 7: Validación de tipo segura. Si no es válido o no existe, es PENDIENTE.
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
        statusDate: null,
        requiredSubjectIds: requiredIds,
      });
    });
    // Punto 6: Eliminado el try/catch redundante. El GlobalFilter capturará errores.
  }

  // Método auxiliar mantenido por si se necesita externamente, pero getCareerGraph ahora es autosuficiente con el email
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateSubjectRecord(
    userEmail: string,
    subjectId: string,
    payload: UpdateSubjectRecordDto,
  ) {
    // Buscamos usuario por email primero
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new NotFoundException('Materia no encontrada.');
    }

    if (payload.status === SubjectStatus.DISPONIBLE) {
      throw new BadRequestException('El estado DISPONIBLE se calcula automáticamente.');
    }

    // Nota: statusDate se eliminó de la lógica según el código original que pasaste, 
    // pero si lo necesitas, asegúrate de validarlo.
    
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
      },
      update: {
        status: payload.status,
        finalGrade: payload.grade ?? null,
      },
    });
  }
}