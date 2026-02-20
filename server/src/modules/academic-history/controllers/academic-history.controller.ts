import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcademicHistoryService } from '../services/academic-history.service';
import {
  AcademicHistoryFilterDto,
  EditAcademicRecordDto,
  AcademicHistoryRowDto,
  AcademicHistoryPageDto,
  BatchSaveHistoryDto,
} from '../dto';
import { PdfParserService } from '../../../shared/pdf-parser/pdf-parser.service';
import { EnvironmentAuthGuard } from '../../../common/guards/environment-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('history')
@UseGuards(EnvironmentAuthGuard)
export class AcademicHistoryController {
  constructor(
    private readonly historyService: AcademicHistoryService,
    private readonly pdfParserService: PdfParserService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Obtener historial académico con filtros' })
  @ApiResponse({ status: 200, description: 'Paginated history' })
  async getHistory(
    @Query() filter: AcademicHistoryFilterDto,
    @CurrentUser('email') userEmail: string,
  ): Promise<AcademicHistoryPageDto> {
    return this.historyService.getHistory(userEmail, filter);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Parsear un PDF de Historia Académica' })
  @ApiResponse({ status: 200, description: 'Parsed PDF data ready for preview' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5000000 }), // 5MB
          new FileTypeValidator({ fileType: 'pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const parsedData = await this.pdfParserService.parseHistoriaAcademica(file.buffer);
    return { data: parsedData };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Guardar múltiples registros de historia académica' })
  @ApiResponse({ status: 200, description: 'Records updated' })
  async batchUpdateRecords(
    @Body() dto: BatchSaveHistoryDto,
    @CurrentUser('email') userEmail: string,
  ) {
    return this.historyService.batchUpdateRecords(userEmail, dto.records);
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
