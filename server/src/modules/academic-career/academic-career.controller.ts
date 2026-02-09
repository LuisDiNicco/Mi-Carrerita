import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AcademicCareerService } from './academic-career.service';
import { SubjectNodeDto } from './dto/subject-node.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

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
    const userEmail = 'admin@micarrerita.com';
    
    // Usamos un método público del servicio, NO accedemos a propiedades privadas
    const user = await this.academicCareerService.findUserByEmail(userEmail);

    if (!user) {
      throw new NotFoundException('Usuario Admin no encontrado. Ejecuta el seed.');
    }

    return this.academicCareerService.getCareerGraph(user.id);
  }
}