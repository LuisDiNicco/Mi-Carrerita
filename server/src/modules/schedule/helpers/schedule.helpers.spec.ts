import {
  detectConflicts,
  checkNewTimetableConflicts,
  isValidTimetable,
  TimetableCheck,
} from './schedule.helpers';
import { TimePeriod } from '../../../common/constants/schedule-enums';

describe('Schedule Helpers', () => {
  describe('isValidTimetable', () => {
    it('debería ser válido para datos correctos', () => {
      const timetable = {
        subjectId: 'id1',
        subjectName: 'Matemáticas',
        planCode: 'MAT01',
        period: TimePeriod.M1, // mañana
        dayOfWeek: 1, // lunes
      };
      const result = isValidTimetable(timetable);
      expect(result.valid).toBe(true);
    });

    it('debería ser válido para datos correctos', () => {
      const timetable: TimetableCheck = {
        subjectId: 'sub-1',
        subjectName: 'Test Subject',
        planCode: 'PLAN2023',
        period: TimePeriod.M1,
        dayOfWeek: 1,
      };
      const result = isValidTimetable(timetable);
      expect(result.valid).toBe(true);
    });
    it('debería ser inválido si falta información', () => {
      const timetable = {
        subjectId: '',
        subjectName: '',
        planCode: '',
        period: TimePeriod.M1,
        dayOfWeek: 1,
      };
      const result = isValidTimetable(timetable);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('debería ser inválido si dayOfWeek es incorrecto (boundaries)', () => {
      const timetable = {
        subjectId: 'id1',
        subjectName: 'M',
        planCode: 'M1',
        period: TimePeriod.M1,
        dayOfWeek: 7, // Domingo (fuera de rango 1-6)
      };
      const result = isValidTimetable(timetable);
      expect(result.valid).toBe(false);
    });
    it('debería ser inválido si dayOfWeek es incorrecto (boundaries)', () => {
      const timetable: TimetableCheck = {
        subjectId: 'sub-1',
        subjectName: 'Test Subject',
        planCode: 'PLAN2023',
        period: TimePeriod.M1,
        dayOfWeek: 7, // Invalid
      };
      const result = isValidTimetable(timetable);
      expect(result.valid).toBe(false);
    });
  });

  describe('checkNewTimetableConflicts', () => {
    const existing: TimetableCheck[] = [
      {
        subjectId: 'id1',
        subjectName: 'Mate',
        planCode: 'M1',
        period: TimePeriod.M1,
        dayOfWeek: 1, // Lunes Mañana
      },
      {
        subjectId: 'id2',
        subjectName: 'Fisica',
        planCode: 'F1',
        period: TimePeriod.T1,
        dayOfWeek: 2, // Martes Tarde
      },
    ];

    it('no debería detectar conflicto si es distinto día o turno', () => {
      const nuevo: TimetableCheck = {
        subjectId: 'id3',
        subjectName: 'Quimica',
        planCode: 'Q1',
        period: TimePeriod.M1,
        dayOfWeek: 2, // Martes Mañana (No choca con Fisica que es Tarde)
      };
      const conflicts = checkNewTimetableConflicts(existing, nuevo);
      expect(conflicts.length).toBe(0);
    });

    it('debería detectar conflicto si mismo dia y turno', () => {
      const nuevo: TimetableCheck = {
        subjectId: 'id3',
        subjectName: 'Quimica',
        planCode: 'Q1',
        period: TimePeriod.M1,
        dayOfWeek: 1, // Lunes Mañana (Choca con Mate)
      };
      const conflicts = checkNewTimetableConflicts(existing, nuevo);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].subject1Id).toBe('id1'); // Mate
      expect(conflicts[0].subject2Id).toBe('id3'); // Quimica
    });
    it('debería detectar conflicto si mismo dia y turno', () => {
      const existing = [
        {
          subjectId: 's1',
          subjectName: 'A',
          planCode: 'P1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
      ];
      const newEntry = {
        subjectId: 's2',
        subjectName: 'B',
        planCode: 'P1',
        period: TimePeriod.M1,
        dayOfWeek: 1,
      };

      const conflicts = checkNewTimetableConflicts(existing, newEntry);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].subject1Id).toBe('s1');
      expect(conflicts[0].subject2Id).toBe('s2');
    });
  });

  describe('detectConflicts (Múltiples Entradas al unísono)', () => {
    it('no debería retornar vacío si todos están okay', () => {
      const horarios: TimetableCheck[] = [
        {
          subjectId: '1',
          subjectName: 'A',
          planCode: 'A1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
        {
          subjectId: '2',
          subjectName: 'B',
          planCode: 'B1',
          period: TimePeriod.T1,
          dayOfWeek: 1,
        },
        {
          subjectId: '3',
          subjectName: 'C',
          planCode: 'C1',
          period: TimePeriod.M1,
          dayOfWeek: 2,
        },
      ];
      expect(detectConflicts(horarios).length).toBe(0);
    });
    it('no debería detectar conflicto si es distinto día o turno', () => {
      const existing = [
        {
          subjectId: 's1',
          subjectName: 'A',
          planCode: 'P1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
      ];
      const newEntry = {
        subjectId: 's2',
        subjectName: 'B',
        planCode: 'P1',
        period: TimePeriod.T1,
        dayOfWeek: 1,
      };

      const conflicts = checkNewTimetableConflicts(existing, newEntry);
      expect(conflicts).toHaveLength(0);
    });

    it('debería identificar múltiples conflictos bidireccionales evitando duplicados exactos', () => {
      const horarios: TimetableCheck[] = [
        {
          subjectId: '1',
          subjectName: 'A',
          planCode: 'A1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
        {
          subjectId: '2',
          subjectName: 'B',
          planCode: 'B1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        }, // Choca con A
        {
          subjectId: '3',
          subjectName: 'C',
          planCode: 'C1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        }, // Choca con A y B
      ];
      const conflicts = detectConflicts(horarios);
      expect(conflicts.length).toBe(3); // A-B, A-C, B-C
    });
    it('debería identificar múltiples conflictos bidireccionales evitando duplicados exactos', () => {
      const timetables = [
        {
          subjectId: 's1',
          subjectName: 'A',
          planCode: 'P1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
        {
          subjectId: 's2',
          subjectName: 'B',
          planCode: 'P1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
        {
          subjectId: 's3',
          subjectName: 'C',
          planCode: 'P1',
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
      ];
      const result = detectConflicts(timetables);
      // s1-s2, s1-s3, s2-s3
      expect(result).toHaveLength(3);
    });
  });
});
