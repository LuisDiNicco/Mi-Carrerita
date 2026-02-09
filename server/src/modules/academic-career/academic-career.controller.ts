import { Controller, Get, NotFoundException } from '@nestjs/common'; // <--- Agregamos NotFoundException
import { AcademicCareerService } from './academic-career.service';

@Controller('academic-career')
export class AcademicCareerController {
  constructor(private readonly academicCareerService: AcademicCareerService) {}

  @Get('graph')
  async getGraph() { // <--- Agregamos async para usar await y que sea más limpio
    const userEmail = 'admin@micarrerita.com';
    
    // Accedemos al prisma del servicio (aunque sea privado, JS lo permite con ['...'])
    // Nota: Lo ideal sería exponer un método en el servicio, pero por ahora sirve.
    const user = await this.academicCareerService['prisma'].user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      // ESTA ES LA SOLUCIÓN: Lanzar la excepción en vez de retornar un objeto
      throw new NotFoundException('Usuario no encontrado. Por favor corre el seed de nuevo.');
    }

    return this.academicCareerService.getCareerGraph(user.id);
  }
}