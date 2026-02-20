import { Injectable, BadRequestException, Logger } from '@nestjs/common';
const pdfParse = require('pdf-parse');

export interface ParsedAcademicRecord {
    planCode: string;
    name: string;
    date: string; // DD/MM/YYYY
    grade: number | null;
    acta: string;
    status?: string;
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
            const records: any[] = [];
            let currentRecord: any = null;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Strip page footer/header lines that would corrupt the rawBuffer
                // e.g. "Página 1 de 2", "Historia Académica - UTN"
                if (/^p[aá]gina\s+\d+\s+de\s+\d+/i.test(line)) continue;
                if (/^historia\s+acad[eé]mica/i.test(line)) continue;

                const startMatch = line.match(/^(\d+)(Promocion|Equivalencia|Examen|Aprobado|Regular)(0?\d{4})(.*)$/i);
                if (startMatch) {
                    if (currentRecord) records.push(currentRecord);

                    currentRecord = {
                        nro: startMatch[1],
                        origen: startMatch[2],
                        planCode: startMatch[3].replace(/^0+/, ''),
                        rawBuffer: startMatch[4]
                    };
                } else if (currentRecord) {
                    currentRecord.rawBuffer += (currentRecord.rawBuffer ? ' ' : '') + line;
                }
            }
            if (currentRecord) records.push(currentRecord);

            const parsedRecords: ParsedAcademicRecord[] = [];
            for (const r of records) {
                const endMatch = r.rawBuffer.match(/^(.*?)\s*([0-9][a-zA-Z0-9\/-]*?)\s*(\d{2}\/\d{2}\/\d{4})\s*(\d+)?$/);
                if (endMatch) {
                    const isEquivalencia = r.origen.toLowerCase() === 'equivalencia';
                    parsedRecords.push({
                        planCode: r.planCode,
                        name: endMatch[1].trim(),
                        date: endMatch[3],
                        grade: endMatch[4] ? parseInt(endMatch[4], 10) : null,
                        acta: endMatch[2].trim(),
                        // Will map status in the frontend/backend service where appropriate.
                        status: isEquivalencia ? 'EQUIVALENCIA' : undefined
                    });
                }
            }

            return parsedRecords;
        } catch (error: any) {
            require('fs').writeFileSync('pdf-error-debug.txt', error instanceof Error ? (error.message + '\n' + error.stack) : String(error));
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
