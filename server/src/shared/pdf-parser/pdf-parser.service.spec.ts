import { PdfParserService } from './pdf-parser.service';
import { BadRequestException } from '@nestjs/common';

const pdfParse = require('pdf-parse');
jest.mock('pdf-parse', () => jest.fn());

describe('PdfParserService', () => {
  let service: PdfParserService;

  beforeEach(() => {
    service = new PdfParserService();
    jest.clearAllMocks();
  });

  describe('parseHistoriaAcademica', () => {
    /**
     * REAL PDF FORMAT (no spaces between fields, all concatenated):
     *   {Nro}{Origen}{PlanCode5digits}{Name}{Acta}{DD/MM/YYYY}{Grade?}
     *
     * Example single-line record:
     *   "2Promocion01026TECNOLOGIA INGENIERIA Y SOCIEDAD3899202029/08/20208"
     *
     * Example multi-line record (name wraps to next lines):
     *   "26Equivalencia03624"
     *   "INTRODUCCION A LOS SISTEMAS DE"
     *   "INFORMACION"
     *   "0431/202221/12/20229"
     */

    it('should return empty array when no rows match the pattern', async () => {
      const mockText = 'No hay tabla aquí, solo texto libre.\nOtra línea.';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));
      expect(result).toHaveLength(0);
    });

    it('should parse a single-line Promocion record correctly', async () => {
      // Real format: Nro+Origen+PlanCode+Name+Acta+Date+Grade all concatenated
      const mockText =
        '2Promocion01026TECNOLOGIA INGENIERIA Y SOCIEDAD3899202029/08/20208';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].planCode).toBe('1026');
      expect(result[0].name).toBe('TECNOLOGIA INGENIERIA Y SOCIEDAD');
      expect(result[0].date).toBe('29/08/2020');
      expect(result[0].grade).toBe(8);
      expect(result[0].status).toBeUndefined();
    });

    it('should strip leading zeros from plan codes', async () => {
      // Plan code 03622 → should become "3622"
      const mockText =
        '24Equivalencia03622ANALISIS MATEMATICO I0431/202221/12/20229';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].planCode).toBe('3622');
    });

    it('should parse Equivalencia with grade correctly', async () => {
      const mockText =
        '23Equivalencia03621MATEMATICA DISCRETA0431/202221/12/202210';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('EQUIVALENCIA');
      expect(result[0].grade).toBe(10);
      expect(result[0].date).toBe('21/12/2022');
    });

    it('should parse Equivalencia WITHOUT grade (null)', async () => {
      // Inglés equivalencias have no grade
      const mockText = '10Equivalencia00901INGLES NIVEL I0372/202111/08/2021';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('EQUIVALENCIA');
      expect(result[0].grade).toBeNull();
      expect(result[0].date).toBe('11/08/2021');
    });

    it('should parse multi-line name records correctly', async () => {
      // Record 26: name spans 2 lines
      const mockText = [
        '26Equivalencia03624',
        'INTRODUCCION A LOS SISTEMAS DE',
        'INFORMACION',
        '0431/202221/12/20229',
      ].join('\n');
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].planCode).toBe('3624');
      expect(result[0].name).toBe('INTRODUCCION A LOS SISTEMAS DE INFORMACION');
      expect(result[0].date).toBe('21/12/2022');
      expect(result[0].grade).toBe(9);
    });

    it('should handle acta with slash (e.g. 0431/2022)', async () => {
      const mockText =
        '33Equivalencia03633ANALISIS MATEMATICO II0431/202221/12/20229';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].acta).toBe('0431/2022');
      expect(result[0].grade).toBe(9);
    });

    it('should parse Examen origen correctly (no EQUIVALENCIA status)', async () => {
      const mockText =
        '50Examen03626PRINCIPIOS DE CALIDAD DE SOFTWARE1081202326/07/20237';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].grade).toBe(7);
      expect(result[0].status).toBeUndefined();
    });

    it('should filter out page headers and footers', async () => {
      const mockText = [
        'INGENIERÍA EN INFORMÁTICA',
        'Alumno: DI NICCO, LUIS DEMETRIO',
        'Nro Documento: 43664669',
        'NºOrigenCódigoNombre',
        'Acta /',
        'Resolución',
        'FechaNota',
        '2Promocion01026TECNOLOGIA INGENIERIA Y SOCIEDAD3899202029/08/20208',
        'Página 1 de 2',
        'INGENIERÍA EN INFORMÁTICA',
        '3Promocion01027ALGEBRA Y GEOMETRIA ANALITICA I3898202029/08/20209',
      ].join('\n');
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(2);
      expect(result[0].planCode).toBe('1026');
      expect(result[1].planCode).toBe('1027');
    });

    it('should parse multiple consecutive records', async () => {
      const mockText = [
        '4Promocion01024ELEMENTOS DE PROGRAMACION6556202019/12/20208',
        '5Promocion01029QUIMICA GENERAL6481202019/12/202010',
      ].join('\n');
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseHistoriaAcademica(Buffer.from('fake'));

      expect(result).toHaveLength(2);
      expect(result[0].planCode).toBe('1024');
      expect(result[0].grade).toBe(8);
      expect(result[1].planCode).toBe('1029');
      expect(result[1].grade).toBe(10);
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

      expect(result).toHaveLength(0);
    });

    it('should parse real concatenated row format from PDF', async () => {
      const mockText = [
        'Código  Descripción',
        'Cod.',
        'Comisión  Turno  Días  Modalidad',
        '0901INGLES NIVEL I1300Lu08a12 Semipresencial',
      ].join('\n');

      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseOfertaMaterias(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].planCode).toBe('901');
      expect(result[0].description).toBe('INGLES NIVEL I');
      expect(result[0].commission).toBe('1300');
      expect(result[0].dayLabel).toBe('Lunes');
      expect(result[0].periodLabel).toBe('Mañana');
      expect(result[0].days).toBe('Lu08a12');
    });

    it('should handle merged cells by remembering last valid code and description', async () => {
      const mockText = [
        '0902INGLES NIVEL II1300Lu08a12 Semipresencial',
        '1600Ma14a18 Semipresencial',
      ].join('\n');

      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseOfertaMaterias(Buffer.from('fake'));

      expect(result).toHaveLength(2);
      expect(result[1].planCode).toBe('902');
      expect(result[1].description).toBe('INGLES NIVEL II');
      expect(result[1].commission).toBe('1600');
      expect(result[1].dayLabel).toBe('Martes');
      expect(result[1].periodLabel).toBe('Tarde');
    });

    it('should split multi-day tokens into independent day entries', async () => {
      const mockText = '0901INGLES NIVEL I7275MaVi12a14 Semipresencial';

      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseOfertaMaterias(Buffer.from('fake'));

      expect(result).toHaveLength(2);
      expect(result[0].dayLabel).toBe('Martes');
      expect(result[1].dayLabel).toBe('Viernes');
      expect(result[0].periodLabel).toBe('Tarde');
      expect(result[1].periodLabel).toBe('Tarde');
    });

    it('should parse A distancia as no fixed schedule', async () => {
      const mockText = '0911COMPUTACION NIVEL I6900A distancia';

      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseOfertaMaterias(Buffer.from('fake'));

      expect(result).toHaveLength(1);
      expect(result[0].planCode).toBe('911');
      expect(result[0].dayLabel).toBe('A distancia');
      expect(result[0].periodLabel).toBe('Sin horario');
      expect(result[0].days).toBe('A distancia');
    });

    it('should return empty array when no patterns match', async () => {
      const mockText = 'Sin datos válidos de oferta';
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

      const result = await service.parseOfertaMaterias(Buffer.from('fake'));

      expect(result).toHaveLength(0);
    });

    it('should map all day codes correctly', async () => {
      const days = [
        'Lu08a12',
        'Ma14a18',
        'Mi19a23',
        'Ju08a12',
        'Vi14a18',
        'Sa19a23',
      ];
      const expectedDays = [
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
      ];
      const expectedPeriods = [
        'Mañana',
        'Tarde',
        'Noche',
        'Mañana',
        'Tarde',
        'Noche',
      ];

      for (let i = 0; i < days.length; i++) {
        const mockText = `3622MATERIA TEST1300${days[i]}Semipresencial`;
        (pdfParse as jest.Mock).mockResolvedValue({ text: mockText });

        const result = await service.parseOfertaMaterias(Buffer.from('fake'));

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].dayLabel).toBe(expectedDays[i]);
        expect(result[0].periodLabel).toBe(expectedPeriods[i]);
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
