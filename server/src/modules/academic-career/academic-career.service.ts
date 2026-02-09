import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Usamos el servicio centralizado
import { SubjectNodeDto } from './dto/subject-node.dto';
import { SUBJECT_STATUS } from '../../common/constants/academic-status'; // (Si creaste este archivo antes, sino usá strings)

@Injectable()
export class AcademicCareerService {
  private readonly logger = new Logger(AcademicCareerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCareerGraph(userId: string): Promise<SubjectNodeDto[]> {
    try {
      // 1. Traer Materias + Correlativas + Historial del Usuario
      const subjects = await this.prisma.subject.findMany({
        include: {
          prerequisites: {
            include: {
              prerequisite: true, // Detalles de la materia que necesito
            },
          },
          records: {
            where: { userId }, // Solo mi historial
          },
        },
        orderBy: { semester: 'asc' },
      });

      // 2. Crear Mapas de Progreso (Para búsqueda rápida O(1))
      // Set de IDs de materias donde tengo FINAL APROBADO
      const finalApprovedIds = new Set<string>();
      // Set de IDs de materias donde tengo REGULARIZADA (o Aprobada, que implica Regular)
      const regularApprovedIds = new Set<string>();

      subjects.forEach((sub) => {
        const record = sub.records[0];
        if (record) {
          if (record.status === SUBJECT_STATUS.APROBADA) {
            finalApprovedIds.add(sub.id);
            regularApprovedIds.add(sub.id); // Si aprobé final, obvio tengo la regular
          } else if (record.status === SUBJECT_STATUS.REGULARIZADA) {
            regularApprovedIds.add(sub.id);
          }
        }
      });

      // 3. Evaluar Estado de Cada Materia
      return subjects.map((subject) => {
        const record = subject.records[0];
        let status = record ? (record.status as string) : SUBJECT_STATUS.PENDIENTE;
        let isAvailable = false;

        // Si NO la tengo aprobada ni regularizada ni en curso, evaluamos si PUEDO cursarla
        if (status === SUBJECT_STATUS.PENDIENTE) {
          let meetsAllPrerequisites = true;

          for (const req of subject.prerequisites) {
            const prereqId = req.prerequisiteId;
            
            // Lógica de Negocio UNLaM:
            // "FINAL_APROBADO": Necesito tener el final de la correlativa
            // "REGULAR_CURSADA": Necesito tener la cursada (o final) de la correlativa

            if (req.condition === 'FINAL_APROBADO') {
              if (!finalApprovedIds.has(prereqId)) {
                meetsAllPrerequisites = false;
                break; // Ya falló una, no sigo buscando
              }
            } else if (req.condition === 'REGULAR_CURSADA') {
              if (!regularApprovedIds.has(prereqId)) {
                meetsAllPrerequisites = false;
                break;
              }
            }
          }

          if (meetsAllPrerequisites) {
            status = SUBJECT_STATUS.DISPONIBLE;
            isAvailable = true;
          }
        }

        // 4. Mapear a DTO
        const requiredIds = subject.prerequisites.map(
          (p) => p.prerequisite.planCode,
        );

        return new SubjectNodeDto({
          id: subject.id,
          planCode: subject.planCode,
          name: subject.name,
          semester: subject.semester,
          credits: subject.credits,
          status: status, // Ahora puede ser 'DISPONIBLE'
          grade: record?.finalGrade || null,
          requiredSubjectIds: requiredIds,
          // (Opcional) Podrías agregar el booleano al DTO si querés ser explícito
          // isAvailable: isAvailable 
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
}