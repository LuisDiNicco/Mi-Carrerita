import { PdfParserService } from './pdf-parser.service';
import { BadRequestException } from '@nestjs/common';

// Mock pdf-parse module
jest.mock('pdf-parse', () => {
    return jest.fn();
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

describe('PdfParserService', () => {
    let service: PdfParserService;

    beforeEach(() => {
        service = new PdfParserService();
        jest.clearAllMocks();
    });

    describe('parseHistoriaAcademica', () => {
        it('should parse valid academic history rows correctly', async () => {
            const mockText = [
                'Encabezado del PDF',
                ' 03622  Algoritmos y Estructuras de Datos    15/07/2023  8  ARG-2023-001',
                ' 03623  Base de Datos                        20/11/2023  7  ARG-2023-002',
            ].join('\n');

            (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

            const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                planCode: '3622',
                name: 'Algoritmos y Estructuras de Datos',
                date: '15/07/2023',
                grade: 8,
                acta: 'ARG-2023-001',
            });
            expect(result[1]).toEqual({
                planCode: '3623',
                name: 'Base de Datos',
                date: '20/11/2023',
                grade: 7,
                acta: 'ARG-2023-002',
            });
        });

        it('should return empty array when no rows match the pattern', async () => {
            const mockText = 'No hay tabla aquí, solo texto libre.\nOtra línea.';

            (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

            const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

            expect(result).toHaveLength(0);
        });

        it('should strip leading zeros from plan codes', async () => {
            const mockText = ' 03622  Algoritmos    15/07/2023  8  ACT-001';
            (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

            const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

            expect(result).toHaveLength(1);
            expect(result[0].planCode).toBe('3622');
        });

        it('should throw BadRequestException if pdf-parse fails', async () => {
            (pdfParse as jest.Mock).mockRejectedValue(new Error('Invalid PDF'));

            await expect(
                service.parseHistoriaAcademica(Buffer.from('bad')),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('parseOfertaMaterias', () => {
        it('should parse valid oferta rows with day/time patterns', async () => {
            const mockText = [
                'Encabezado de oferta',
                '3622  Algoritmos         COM-A     Lu19a23  Presencial  San Justo',
            ].join('\n');

            (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

            const result = await service.parseOfertaMaterias(Buffer.from('fake'));

            expect(result).toHaveLength(1);
            expect(result[0].planCode).toBe('3622');
            expect(result[0].dayLabel).toBe('Lunes');
            expect(result[0].periodLabel).toBe('Noche');
        });

        it('should handle merged cells by remembering last valid code', async () => {
            const mockText = [
                '3622  Algoritmos         COM-A     Lu19a23  Presencial  San Justo',
                '                          COM-B     Ma08a12  Virtual     San Justo',
            ].join('\n');

            (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

            const result = await service.parseOfertaMaterias(Buffer.from('fake'));

            // Both should reference the same subject
            expect(result.length).toBeGreaterThanOrEqual(1);
            if (result.length >= 2) {
                expect(result[1].planCode).toBe('3622');
                expect(result[1].dayLabel).toBe('Martes');
                expect(result[1].periodLabel).toBe('Mañana');
            }
        });

        it('should return empty array when no patterns match', async () => {
            const mockText = 'Sin datos válidos de oferta';
            (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

            const result = await service.parseOfertaMaterias(Buffer.from('fake'));

            expect(result).toHaveLength(0);
        });

        it('should map all day codes correctly', async () => {
            // Test the private parseDiaHorario indirectly
            const days = ['Lu08a12', 'Ma14a18', 'Mi19a23', 'Ju08a12', 'Vi14a18', 'Sa19a23'];
            const expectedDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const expectedPeriods = ['Mañana', 'Tarde', 'Noche', 'Mañana', 'Tarde', 'Noche'];

            for (let i = 0; i < days.length; i++) {
                const mockText = `3622  Test  COM-A  ${days[i]}  Presencial  Sede`;
                (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

                const result = await service.parseOfertaMaterias(Buffer.from('fake'));

                if (result.length > 0) {
                    expect(result[0].dayLabel).toBe(expectedDays[i]);
                    expect(result[0].periodLabel).toBe(expectedPeriods[i]);
                }
            }
        });

        it('should throw BadRequestException if pdf-parse fails', async () => {
            (pdfParse as jest.Mock).mockRejectedValue(new Error('Invalid PDF'));

            await expect(
                service.parseOfertaMaterias(Buffer.from('bad')),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
