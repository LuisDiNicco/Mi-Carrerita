import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcademicCareerService } from '../services/academic-career.service';
import { SubjectNodeDto } from '../dto/subject-node.dto';

@Controller('academic-career')
export class AcademicCareerPublicController {
  constructor(private readonly academicCareerService: AcademicCareerService) {}

  @Get('public-graph')
  @ApiOperation({ summary: 'Obtener el grafo base de materias para invitados' })
  @ApiResponse({
    status: 200,
    description: 'Grafo público retornado exitosamente.',
    type: [SubjectNodeDto],
  })
  async getPublicGraph(): Promise<SubjectNodeDto[]> {
    return this.academicCareerService.getPublicCareerGraph();
  }
}
