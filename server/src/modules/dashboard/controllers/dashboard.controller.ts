import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardDataDto } from '../dto';
import { EnvironmentAuthGuard } from '../../../common/guards/environment-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(EnvironmentAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtener datos completos del dashboard (todos los gráficos y resumen)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data with all charts and summary',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  async getDashboard(
    @CurrentUser('email') userEmail: string,
  ): Promise<DashboardDataDto> {
    return this.dashboardService.getDashboardData(userEmail);
  }
}
