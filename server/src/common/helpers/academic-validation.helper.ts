import { BadRequestException } from '@nestjs/common';
import { SubjectStatus } from '../constants/academic-enums';

export interface AcademicRecordValidationPayload {
  status: string;
  grade?: number | null;
  notes?: string | null;
}

/**
 * Parses a YYYY-MM-DD string into a Date object set to UTC noon
 * to avoid timezone shifts when converting back to string in different zones.
 * Also handles Date objects if passed (cloning them).
 */
export function parseIsolatedDate(dateInput: string | Date): Date {
  let date: Date;

  if (dateInput instanceof Date) {
    date = new Date(dateInput); // clone
  } else if (typeof dateInput === 'string') {
    // If it's already a full ISO string (with T), use it directly
    if (dateInput.includes('T')) {
      date = new Date(dateInput);
    } else {
      // It's a date-only string like "2023-01-01"
      date = new Date(dateInput);
    }
  } else {
    throw new BadRequestException('Fecha inválida. Use formato YYYY-MM-DD');
  }

  if (isNaN(date.getTime())) {
    throw new BadRequestException('Fecha inválida.');
  }

  // If the date is exactly at UTC midnight (00:00:00.000), move it to noon
  // This helps preserve the "date" part across timezones when displayed
  // Assuming inputs without time usually default to UTC midnight
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
    date.setUTCHours(12, 0, 0, 0);
  }

  return date;
}

/**
 * Validates consistency of academic record data.
 * Throws BadRequestException if validation fails.
 */
export function validateAcademicRecord(payload: AcademicRecordValidationPayload): void {
  if (payload.status === SubjectStatus.DISPONIBLE) {
    throw new BadRequestException(
      'El estado DISPONIBLE se calcula automaticamente.',
    );
  }

  if (payload.status === SubjectStatus.APROBADA && (payload.grade === null || payload.grade === undefined)) {
    throw new BadRequestException(
      'Una materia aprobada requiere nota final.',
    );
  }

  if (
    payload.status !== SubjectStatus.APROBADA &&
    payload.status !== SubjectStatus.RECURSADA &&
    payload.grade !== null &&
    payload.grade !== undefined
  ) {
    throw new BadRequestException(
      'Solo una materia aprobada o recursada puede tener nota final.',
    );
  }
}
