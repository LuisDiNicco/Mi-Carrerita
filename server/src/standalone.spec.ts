import * as fs from 'fs';
const pdfParse = require('pdf-parse');

describe('standalone', () => {
    it('runs', async () => {
        try {
            const buffer = fs.readFileSync('c:\\Users\\luisd\\Desktop\\Proyectos\\Mi-Carrerita\\43664669_historia_academica.pdf');
            const data = await pdfParse(buffer);
            fs.writeFileSync('standalone-success.txt', data.text);
        } catch (e: any) {
            fs.writeFileSync('standalone-error.txt', e.stack || String(e));
        }
    });
});
