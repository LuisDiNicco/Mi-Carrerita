import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AcademicCareerService {
  private prisma = new PrismaClient();

  async getCareerGraph(userId: string) {
    // 1. Traer todas las materias y sus correlativas
    const subjects = await this.prisma.subject.findMany({
      include: {
        prerequisites: {
          include: {
            prerequisite: true, // Detalles de la materia que necesito
          },
        },
        records: {
          where: { userId: userId }, // Mi estado en esa materia
        },
      },
      // Ordenamos por cuatrimestre sugerido para que el JSON venga ordenadito
      orderBy: { semester: 'asc' },
    });

    // 2. Transformar la respuesta para que el Frontend la entienda fácil
    return subjects.map((subject) => {
        // Buscamos si tengo algún registro (aprobada/cursada)
        const record = subject.records[0];
        const status = record ? record.status : 'PENDIENTE';

        return {
            id: subject.id,
            planCode: subject.planCode,
            name: subject.name,
            semester: subject.semester,
            credits: subject.credits,
            status: status, // "PENDIENTE", "APROBADA", etc.
            grade: record?.finalGrade || null,
            // Lista de IDs que necesito tener aprobadas/regulares antes
            requiredSubjectIds: subject.prerequisites.map(p => p.prerequisite.planCode)
        };
    });
  }
}