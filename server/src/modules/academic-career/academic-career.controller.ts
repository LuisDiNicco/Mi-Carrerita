import { Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common';
import { AcademicCareerService } from './academic-career.service';
import { SubjectNodeDto } from './dto/subject-node.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateSubjectRecordDto } from './dto/update-subject-record.dto';
import { DEFAULT_USER_EMAIL } from './academic-career.constants';

@Controller('academic-career')
export class AcademicCareerController {
  constructor(private readonly academicCareerService: AcademicCareerService) {}

  @Get('graph')
  @ApiOperation({ summary: 'Obtener el grafo de materias del usuario' })
  @ApiResponse({ status: 200, description: 'Grafo retornado exitosamente.', type: [SubjectNodeDto] })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async getGraph(): Promise<SubjectNodeDto[]> {
    // TODO: A futuro, sacaremos el ID del usuario del JWT (Request)
    // const userId = req.user.id;
    const userEmail = DEFAULT_USER_EMAIL;
    
    // Usamos un método público del servicio, NO accedemos a propiedades privadas
    const user = await this.academicCareerService.findUserByEmail(userEmail);

    if (!user) {
      throw new NotFoundException('Usuario Admin no encontrado. Ejecuta el seed.');
    }

    return this.academicCareerService.getCareerGraph(user.id);
  }

  @Patch('subjects/:subjectId')
  @ApiOperation({ summary: 'Actualizar estado, nota y comentarios de una materia' })
  @ApiResponse({ status: 200, description: 'Materia actualizada correctamente.' })
  async updateSubjectRecord(
    @Param('subjectId') subjectId: string,
    @Body() payload: UpdateSubjectRecordDto,
  ) {
    const userEmail = DEFAULT_USER_EMAIL;
    const user = await this.academicCareerService.findUserByEmail(userEmail);

    if (!user) {
      throw new NotFoundException('Usuario Admin no encontrado. Ejecuta el seed.');
    }

    return this.academicCareerService.updateSubjectRecord(user.id, subjectId, payload);
  }
}