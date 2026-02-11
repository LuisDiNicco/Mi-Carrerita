import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AcademicCareerService } from '../services/academic-career.service';
import { SubjectNodeDto } from '../dto/subject-node.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateSubjectRecordDto } from '../dto/update-subject-record.dto';
import { DevAuthGuard } from '../../../common/guards/dev-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('academic-career')
@UseGuards(DevAuthGuard)
export class AcademicCareerController {
  constructor(private readonly academicCareerService: AcademicCareerService) {}

  @Get('graph')
  @ApiOperation({ summary: 'Obtener el grafo de materias del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Grafo retornado exitosamente.',
    type: [SubjectNodeDto],
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async getGraph(
    @CurrentUser('email') userEmail: string,
  ): Promise<SubjectNodeDto[]> {
    return this.academicCareerService.getCareerGraph(userEmail);
  }

  @Patch('subjects/:subjectId')
  @ApiOperation({
    summary: 'Actualizar estado, nota y comentarios de una materia',
  })
  @ApiResponse({
    status: 200,
    description: 'Materia actualizada correctamente.',
  })
  async updateSubjectRecord(
    @Param('subjectId') subjectId: string,
    @Body() payload: UpdateSubjectRecordDto,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.academicCareerService.updateSubjectRecord(
      userEmail,
      subjectId,
      payload,
    );
  }
}
