import * as fs from 'fs';
import { PdfParserService } from './server/src/shared/pdf-parser/pdf-parser.service';

async function test() {
    console.log("Starting test...");
    const service = new PdfParserService();
    const buffer = fs.readFileSync('c:\\Users\\luisd\\Desktop\\Proyectos\\Mi-Carrerita\\43664669_historia_academica.pdf');
    try {
        const result = await service.parseHistoriaAcademica(buffer);
        console.log("Parsed result:", result);
    } catch (e) {
        console.error("Error occurred:", e);
    }
}

test();
