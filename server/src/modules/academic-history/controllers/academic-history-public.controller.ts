import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PdfParserService } from '../../../shared/pdf-parser/pdf-parser.service';

@Controller('history')
export class AcademicHistoryPublicController {
  constructor(private readonly pdfParserService: PdfParserService) {}

  @Post('public-upload')
  @ApiOperation({ summary: 'Parsear PDF de Historia Académica para invitados' })
  @ApiResponse({
    status: 200,
    description: 'Parsed PDF data ready for preview',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdfPublic(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5000000 }),
          new FileTypeValidator({ fileType: 'pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const parsedData = await this.pdfParserService.parseHistoriaAcademica(
      file.buffer,
    );
    return { data: parsedData };
  }
}
