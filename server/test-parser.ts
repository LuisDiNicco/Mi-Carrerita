import * as fs from 'fs';
import { PdfParserService } from './src/shared/pdf-parser/pdf-parser.service';

async function test() {
    console.log("Starting test-parser.ts");
    const buffer = fs.readFileSync('c:\\Users\\luisd\\Desktop\\Proyectos\\Mi-Carrerita\\43664669_historia_academica.pdf');
    try {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const data = await pdfParse(buffer);
        fs.writeFileSync('pdf-output.txt', data.text);

        const lines = data.text.split('\n');
        const equivLines = lines.filter((l: string) => l.includes('Equivalencia'));
        fs.writeFileSync('equiv-lines.txt', equivLines.join('\n'));
        console.log("Saved output to pdf-output.txt and equiv-lines.txt");
    } catch (e: any) {
        console.error("Error occurred:", e.message);
    }
}

test();
