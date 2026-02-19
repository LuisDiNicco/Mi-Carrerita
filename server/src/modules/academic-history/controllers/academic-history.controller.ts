import {
  Controller,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcademicHistoryService } from '../services/academic-history.service';
import {
  AcademicHistoryFilterDto,
  EditAcademicRecordDto,
  AcademicHistoryRowDto,
  AcademicHistoryPageDto,
} from '../dto';
import { EnvironmentAuthGuard } from '../../../common/guards/environment-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('history')
@UseGuards(EnvironmentAuthGuard)
export class AcademicHistoryController {
  constructor(private readonly historyService: AcademicHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener historial académico con filtros' })
  @ApiResponse({ status: 200, description: 'Paginated history' })
  async getHistory(
    @Query() filter: AcademicHistoryFilterDto,
    @CurrentUser('email') userEmail: string,
  ): Promise<AcademicHistoryPageDto> {
    return this.historyService.getHistory(userEmail, filter);
  }

  @Patch(':recordId')
  @ApiOperation({ summary: 'Editar un registro de materia' })
  @ApiResponse({ status: 200, description: 'Record updated' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async updateRecord(
    @Param('recordId') recordId: string,
    @Body() update: EditAcademicRecordDto,
    @CurrentUser('email') userEmail: string,
  ): Promise<AcademicHistoryRowDto> {
    return this.historyService.updateRecord(userEmail, recordId, update);
  }

  @Delete(':recordId')
  @ApiOperation({ summary: 'Eliminar un registro de materia' })
  @ApiResponse({ status: 204, description: 'Record deleted' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async deleteRecord(
    @Param('recordId') recordId: string,
    @CurrentUser('email') userEmail: string,
  ): Promise<void> {
    return this.historyService.deleteRecord(userEmail, recordId);
  }

  @Delete()
  @ApiOperation({ summary: 'Eliminar TODO el historial académico' })
  @ApiResponse({ status: 204, description: 'All records deleted' })
  async deleteAllRecords(
    @CurrentUser('email') userEmail: string,
  ): Promise<void> {
    return this.historyService.deleteAll(userEmail);
  }
}
