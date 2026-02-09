import { ApiProperty } from '@nestjs/swagger'; // <--- Importar
import { Expose } from 'class-transformer';

export class SubjectNodeDto {
  @ApiProperty({ example: 'uuid-1234', description: 'ID único de la materia' })
  @Expose()
  id: string;

  @ApiProperty({ example: '3622', description: 'Código del plan de estudios' })
  @Expose()
  planCode: string;

  @ApiProperty({ example: 'Análisis Matemático 1', description: 'Nombre oficial' })
  @Expose()
  name: string;

  @ApiProperty({ example: 1, description: 'Cuatrimestre sugerido' })
  @Expose()
  semester: number;

  @ApiProperty({ example: 8, description: 'Créditos u horas semanales' })
  @Expose()
  credits: number;

  @ApiProperty({ example: 'PENDIENTE', description: 'Estado académico del alumno' })
  @Expose()
  status: string;

  @ApiProperty({ example: 9, description: 'Nota final (si aplica)', nullable: true })
  @Expose()
  grade: number | null;

  @ApiProperty({ example: ['3621'], description: 'IDs de materias correlativas necesarias' })
  @Expose()
  requiredSubjectIds: string[];

  constructor(partial: Partial<SubjectNodeDto>) {
    Object.assign(this, partial);
  }
}