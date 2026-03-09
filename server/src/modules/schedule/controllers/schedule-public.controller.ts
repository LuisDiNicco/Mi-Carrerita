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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PdfParserService } from '../../../shared/pdf-parser/pdf-parser.service';

@ApiTags('Schedule Public')
@Controller('schedule')
export class SchedulePublicController {
    constructor(private readonly pdfParserService: PdfParserService) { }

    @Post('public-upload-oferta')
    @ApiOperation({ summary: 'Parsear un PDF de Oferta de Materias (Público para invitados)' })
    @ApiResponse({ status: 200, description: 'Parsed offering data' })
    @UseInterceptors(FileInterceptor('file'))
    async uploadOfertaPublic(
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
        const parsedData = await this.pdfParserService.parseOfertaMaterias(
            file.buffer,
        );
        return { data: parsedData };
    }
}
