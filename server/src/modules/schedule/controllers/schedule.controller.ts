import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScheduleService } from '../services/schedule.service';
import { RecommendationService } from '../services/recommendation.service';
import {
  CreateTimetableDto,
  SetTimetableDto,
  TimetableDto,
  ConflictDto,
  RecommendationResultDto,
  UpdateRecommendationStatusDto,
} from '../dto';
import { EnvironmentAuthGuard } from '../../../common/guards/environment-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('schedule')
@UseGuards(EnvironmentAuthGuard)
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly recommendationService: RecommendationService,
  ) {}

  // ========================
  // Timetable Endpoints
  // ========================

  @Post('timetable')
  @ApiOperation({ summary: 'Crear un nuevo horario para una materia' })
  @ApiResponse({ status: 201, description: 'Timetable created' })
  @ApiResponse({ status: 400, description: 'Conflict or validation error' })
  async setTimetable(
    @Body() dto: CreateTimetableDto,
    @CurrentUser('email') userEmail: string,
  ): Promise<TimetableDto> {
    return this.scheduleService.setTimetable(userEmail, dto);
  }

  @Post('timetable/batch')
  @ApiOperation({ summary: 'Crear múltiples horarios a la vez' })
  @ApiResponse({ status: 201, description: 'Timetables created' })
  async setMultipleTimetables(
    @Body() dto: SetTimetableDto,
    @CurrentUser('email') userEmail: string,
  ): Promise<TimetableDto[]> {
    return this.scheduleService.setMultipleTimetables(
      userEmail,
      dto.timetables,
    );
  }

  @Get('timetable')
  @ApiOperation({ summary: 'Obtener todos los horarios del usuario' })
  @ApiResponse({ status: 200, description: 'List of timetables' })
  async getTimetables(
    @CurrentUser('email') userEmail: string,
  ): Promise<TimetableDto[]> {
    return this.scheduleService.getTimetables(userEmail);
  }

  @Delete('timetable/:subjectId')
  @ApiOperation({ summary: 'Eliminar todos los horarios de una materia' })
  @ApiResponse({ status: 204, description: 'Timetable deleted' })
  async deleteTimetable(
    @Param('subjectId') subjectId: string,
    @CurrentUser('email') userEmail: string,
  ): Promise<void> {
    return this.scheduleService.deleteTimetable(userEmail, subjectId);
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'Verificar conflictos en el horario actual' })
  @ApiResponse({
    status: 200,
    description: 'List of conflicts (empty if none)',
  })
  async checkConflicts(
    @CurrentUser('email') userEmail: string,
  ): Promise<ConflictDto[]> {
    return this.scheduleService.checkConflicts(userEmail);
  }

  // ========================
  // Recommendation Endpoints
  // ========================

  @Get('recommendations')
  @ApiOperation({ summary: 'Obtener recomendaciones de materias a cursar' })
  @ApiResponse({ status: 200, description: 'Recommendation result' })
  async getRecommendations(
    @CurrentUser('email') userEmail: string,
  ): Promise<RecommendationResultDto> {
    return this.recommendationService.getRecommendations(userEmail);
  }

  @Post('recommendations/generate')
  @ApiOperation({ summary: 'Generar nuevas recomendaciones' })
  @ApiResponse({ status: 200, description: 'Generated recommendations' })
  async generateRecommendation(
    @CurrentUser('email') userEmail: string,
  ): Promise<RecommendationResultDto> {
    return this.recommendationService.generateRecommendation(userEmail);
  }

  @Patch('recommendations/:subjectId')
  @ApiOperation({
    summary:
      'Cambiar estado de recomendación (SUGGESTED → MANTENIDA → DELETED)',
  })
  @ApiResponse({ status: 200, description: 'Recommendation updated' })
  async updateRecommendationStatus(
    @Param('subjectId') subjectId: string,
    @Body() update: UpdateRecommendationStatusDto,
    @CurrentUser('email') userEmail: string,
  ): Promise<void> {
    // Override the subjectId from path param to ensure security
    const secureUpdate = { ...update, subjectId };
    return this.recommendationService.updateRecommendationStatus(
      userEmail,
      secureUpdate,
    );
  }
}
