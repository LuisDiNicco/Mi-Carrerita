import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Usamos el servicio centralizado
import { SubjectNodeDto } from './dto/subject-node.dto';
import { SUBJECT_STATUS } from '../../common/constants/academic-status'; // (Si creaste este archivo antes, sino usá strings)

@Injectable()
export class AcademicCareerService {
  private readonly logger = new Logger(AcademicCareerService.name);

  // INYECCIÓN DE DEPENDENCIAS: Nest nos pasa la instancia de Prisma
  constructor(private readonly prisma: PrismaService) {}

  async getCareerGraph(userId: string): Promise<SubjectNodeDto[]> {
    try {
      // 1. Consulta optimizada a la BD
      const subjects = await this.prisma.subject.findMany({
        include: {
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
          records: {
            where: { userId },
          },
        },
        orderBy: { semester: 'asc' },
      });

      // 2. Mapeo a DTO (Lógica de presentación)
      return subjects.map((subject) => {
        const record = subject.records[0];
        
        // Determinar estado (Lógica de negocio simple)
        // TODO: Aquí a futuro irá la lógica compleja de "Si tengo las correlativas, paso a DISPONIBLE"
        const status = record ? (record.status as string) : SUBJECT_STATUS.PENDIENTE;

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
          grade: record?.finalGrade || null,
          requiredSubjectIds: requiredIds,
        });
      });
    } catch (error) {
      this.logger.error(`Error generating career graph for user ${userId}`, error);
      throw error; // El Controller o un Filter manejarán esto
    }
  }

  // Método auxiliar para buscar usuario (usado por el controller temporalmente)
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}