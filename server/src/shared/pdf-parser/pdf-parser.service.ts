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

/**
 * Parses the concatenated tail of a Historia Académica record.
 * 
 * Real PDF format (no spaces between fields):
 *   {Acta}{Date DD/MM/YYYY}{Grade?}
 * 
 * The acta can be:
 *   - Pure digits: e.g. "39002020"
 *   - Digits+slash+digits: e.g. "0431/2022", "58/2024"
 * 
 * Strategy: find the date (DD/MM/YYYY) pattern which is unambiguous.
 * Everything before the date is the acta. Everything after is the grade (optional).
 */
function parseTail(tail: string): { acta: string; date: string; grade: number | null } | null {
    // Date is always DD/MM/YYYY
    const dateMatch = tail.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) return null;

    const dateIndex = tail.indexOf(dateMatch[1]);
    const acta = tail.substring(0, dateIndex).trim();
    const after = tail.substring(dateIndex + dateMatch[1].length).trim();
    const grade = after ? parseInt(after, 10) : null;

    return {
        acta,
        date: dateMatch[1],
        grade: isNaN(grade as number) ? null : grade,
    };
}

@Injectable()
export class PdfParserService {
    private readonly logger = new Logger(PdfParserService.name);

    async parseHistoriaAcademica(buffer: Buffer): Promise<ParsedAcademicRecord[]> {
        try {
            const data = await pdfParse(buffer);
            const text = data.text;
            const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

            // Filter out header/footer lines
            const contentLines = lines.filter((line: string) => {
                if (/^p[aá]gina\s+\d+\s+de\s+\d+/i.test(line)) return false;
                if (/^ingenier[ií]a\s+en/i.test(line)) return false;
                if (/^alumno:/i.test(line)) return false;
                if (/^nro\s+documento/i.test(line)) return false;
                if (/^n[º°]origenC[oó]digo/i.test(line)) return false;
                if (/^acta\s*\//i.test(line)) return false;
                if (/^resoluci[oó]n/i.test(line)) return false;
                if (/^fechanota/i.test(line)) return false;
                return true;
            });

            /*
             * RECORD STRUCTURE IN THE PDF (no spaces between fields):
             *
             * Case A — single line:
             *   "{Nro}{Origen}{PlanCode5digits}{Name}{Acta}{DD/MM/YYYY}{Grade?}"
             *   Example: "2Promocion01026TECNOLOGIA INGENIERIA Y SOCIEDAD3899202029/08/20208"
             *
             * Case B — multi-line (long name or special char wraps):
             *   Line 1: "{Nro}{Origen}{PlanCode5digits}"
             *   Line 2..N: name continuation lines
             *   Last line: "{Acta}{DD/MM/YYYY}{Grade?}"
             *
             * Plan codes are always exactly 5 digits (e.g. 01025, 03621).
             *
             * The START of a record is identified by:
             *   /^\d+(Promocion|Equivalencia|Examen|Aprobado|Regular)\d{5}/i
             *
             * The END of a record (the tail line) is identified by:
             *   Contains a DD/MM/YYYY date pattern
             */

            // Regex to detect start of a new record
            const RECORD_START = /^(\d+)(Promocion|Equivalencia|Examen|Aprobado|Regular)(\d{5})(.*)$/i;

            // Regex to detect a "tail" line — contains the date
            const TAIL_PATTERN = /\d{2}\/\d{2}\/\d{4}/;

            interface RawRecord {
                nro: string;
                origen: string;
                planCode: string;
                nameLines: string[];
                tail: string;
            }

            const rawRecords: RawRecord[] = [];
            let current: RawRecord | null = null;

            for (const line of contentLines) {
                const startMatch = line.match(RECORD_START);

                if (startMatch) {
                    // Push previous record before starting new one
                    if (current) rawRecords.push(current);

                    const remainder = startMatch[4]; // everything after the 5-digit planCode

                    if (TAIL_PATTERN.test(remainder)) {
                        // The record is fully contained in one line
                        // remainder = "{Name}{Acta}{Date}{Grade}"
                        // We need to split name from tail
                        // The tail starts at the date minus the acta length
                        // Strategy: find the date in remainder
                        const dateInRemainder = remainder.match(/(\d{2}\/\d{2}\/\d{4})/);
                        if (dateInRemainder) {
                            const dateIdx = remainder.indexOf(dateInRemainder[1]);
                            // Everything before the date contains name+acta
                            // The acta is the digits (optionally with /) immediately before the date
                            const beforeDate = remainder.substring(0, dateIdx);
                            // Separate name from acta: acta = trailing digits/slash block
                            const actaMatch = beforeDate.match(/^(.*?)([0-9][0-9\/]*)$/);
                            if (actaMatch) {
                                current = {
                                    nro: startMatch[1],
                                    origen: startMatch[2],
                                    planCode: startMatch[3].replace(/^0+/, ''),
                                    nameLines: [actaMatch[1].trim()],
                                    tail: actaMatch[2] + dateInRemainder[1] + remainder.substring(dateIdx + dateInRemainder[1].length),
                                };
                            } else {
                                current = {
                                    nro: startMatch[1],
                                    origen: startMatch[2],
                                    planCode: startMatch[3].replace(/^0+/, ''),
                                    nameLines: [beforeDate.trim()],
                                    tail: remainder.substring(dateIdx),
                                };
                            }
                        } else {
                            current = {
                                nro: startMatch[1],
                                origen: startMatch[2],
                                planCode: startMatch[3].replace(/^0+/, ''),
                                nameLines: [remainder.trim()],
                                tail: '',
                            };
                        }
                    } else {
                        // No date in this line yet — name and tail come next
                        current = {
                            nro: startMatch[1],
                            origen: startMatch[2],
                            planCode: startMatch[3].replace(/^0+/, ''),
                            nameLines: remainder.trim() ? [remainder.trim()] : [],
                            tail: '',
                        };
                    }
                } else if (current) {
                    if (TAIL_PATTERN.test(line)) {
                        // This line is the tail (acta+date+grade)
                        current.tail = line;
                        rawRecords.push(current);
                        current = null;
                    } else {
                        // Still accumulating name lines
                        current.nameLines.push(line);
                    }
                }
            }

            // Push any trailing record
            if (current) rawRecords.push(current);

            // Now parse each raw record into the final structure
            const parsedRecords: ParsedAcademicRecord[] = [];

            for (const r of rawRecords) {
                if (!r.tail) {
                    // No tail found — skip malformed record
                    this.logger.warn(`Skipping record ${r.nro} (${r.planCode}): no tail line found`);
                    continue;
                }

                const parsed = parseTail(r.tail);
                if (!parsed) {
                    this.logger.warn(`Skipping record ${r.nro} (${r.planCode}): could not parse tail "${r.tail}"`);
                    continue;
                }

                const isEquivalencia = r.origen.toLowerCase() === 'equivalencia';

                parsedRecords.push({
                    planCode: r.planCode,
                    name: r.nameLines.join(' ').trim(),
                    date: parsed.date,
                    grade: parsed.grade,
                    acta: parsed.acta,
                    status: isEquivalencia ? 'EQUIVALENCIA' : undefined,
                });
            }

            return parsedRecords;
        } catch (error: any) {
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
