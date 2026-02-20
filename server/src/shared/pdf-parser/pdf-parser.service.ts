import { Injectable, BadRequestException, Logger } from '@nestjs/common';
const pdfParse = require('pdf-parse');

export interface ParsedAcademicRecord {
    planCode: string;
    name: string;
    date: string; // DD/MM/YYYY
    grade: number | null;
    acta: string;
}

export interface ParsedTimetableOffer {
    planCode: string;
    description: string;
    dayLabel: string; // e.g. "Lunes"
    periodLabel: string; // e.g. "Noche", "Tarde", "Mañana"
    commission: string;
    modality: string;
    location: string;
}

@Injectable()
export class PdfParserService {
    private readonly logger = new Logger(PdfParserService.name);

    async parseHistoriaAcademica(buffer: Buffer): Promise<ParsedAcademicRecord[]> {
        try {
            const data = await pdfParse(buffer);
            const text = data.text;
            const lines = text.split('\n');
            const records: ParsedAcademicRecord[] = [];

            // Regex para capturar filas típicas de historia académica.
            // Busca: Codigo (ej. 3622 o 03622) + Nombre + Fecha (DD/MM/AAAA) + Nota + Acta
            const rowRegex = /^\s*0?(\d{4})\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+(.+)$/;

            for (const line of lines) {
                const match = line.match(rowRegex);
                if (match) {
                    const [, codigo, nombre, fecha, nota, acta] = match;

                    records.push({
                        planCode: codigo.trim(),
                        name: nombre.trim(),
                        date: fecha,
                        grade: parseInt(nota, 10),
                        acta: acta.trim(),
                    });
                }
            }

            return records;
        } catch (error) {
            this.logger.error('Error parsing Historia Académica', error);
            throw new BadRequestException('No se pudo procesar el archivo. Asegúrese de que sea un PDF válido de Historia Académica.');
        }
    }

    async parseOfertaMaterias(buffer: Buffer): Promise<ParsedTimetableOffer[]> {
        try {
            const data = await pdfParse(buffer);
            const text = data.text;
            const lines = text.split('\n');
            const offers: ParsedTimetableOffer[] = [];

            let lastPlanCode: string | null = null;
            let lastDescription: string | null = null;

            // Patrón para detectar código de día y turno (ej: Ma19a23, Lu08a12)
            const diasTurnoRegex = /([Lu|Ma|Mi|Ju|Vi|Sa]{2})(\d{2}a\d{2})/;

            for (const line of lines) {
                if (line.length < 10) continue;

                const horarioMatch = line.match(diasTurnoRegex);

                if (horarioMatch) {
                    const parts = line.split(/\s{2,}/);

                    let codigo = parts[0]?.trim();
                    let descripcion = parts[1]?.trim();

                    const isCodigoValido = /^\d+$/.test(codigo);

                    if (isCodigoValido) {
                        lastPlanCode = codigo.replace(/^0+/, ''); // lstrip('0')
                        lastDescription = descripcion;
                    } else {
                        codigo = lastPlanCode || '';
                        descripcion = lastDescription || '';
                    }

                    const diasToken = parts.find((p: string) => diasTurnoRegex.test(p));
                    if (!diasToken || !codigo) continue;

                    const indexDias = parts.indexOf(diasToken);
                    const comision = parts[indexDias - 1] || "Sin Comisión";
                    const modalidad = parts[indexDias + 1] || "Presencial";
                    const sede = parts[indexDias + 2] || "Desconocida";

                    if (comision.toLowerCase().includes('no ofertada')) continue;

                    const { dayLabel, periodLabel } = this.parseDiaHorario(diasToken);

                    offers.push({
                        planCode: codigo,
                        description: descripcion || '',
                        dayLabel,
                        periodLabel,
                        commission: comision,
                        modality: modalidad,
                        location: sede
                    });
                }
            }

            return offers;

        } catch (error) {
            this.logger.error('Error parsing Oferta Materias', error);
            throw new BadRequestException('No se pudo procesar el archivo. Asegúrese de que sea un PDF válido de Oferta de Materias.');
        }
    }

    private parseDiaHorario(diasStr: string): { dayLabel: string; periodLabel: string } {
        const nombresDia: Record<string, string> = {
            "Lu": "Lunes", "Ma": "Martes", "Mi": "Miércoles",
            "Ju": "Jueves", "Vi": "Viernes", "Sa": "Sábado", "Do": "Domingo"
        };
        const nombresTurno: Record<string, string> = {
            "08a12": "Mañana", "14a18": "Tarde", "19a23": "Noche"
        };

        const codigoDia = diasStr.substring(0, 2);
        const codigoTurno = diasStr.substring(2);

        return {
            dayLabel: nombresDia[codigoDia] || "Desconocido",
            periodLabel: nombresTurno[codigoTurno] || "Desconocido"
        };
    }
}
