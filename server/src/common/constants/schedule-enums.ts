// Time periods for scheduling
export enum TimePeriod {
  M1 = 'M1',
  M2 = 'M2',
  M3 = 'M3',
  M4 = 'M4',
  M5 = 'M5',
  M6 = 'M6',
  T1 = 'T1',
  T2 = 'T2',
  T3 = 'T3',
  T4 = 'T4',
  T5 = 'T5',
  T6 = 'T6',
  N1 = 'N1',
  N2 = 'N2',
  N3 = 'N3',
  N4 = 'N4',
  N5 = 'N5',
  N6 = 'N6',
}

// Days of week (1 = Monday, 6 = Saturday, no domingo)
export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export const DAY_LABELS: Record<number, string> = {
  [DayOfWeek.MONDAY]: 'Lunes',
  [DayOfWeek.TUESDAY]: 'Martes',
  [DayOfWeek.WEDNESDAY]: 'Miércoles',
  [DayOfWeek.THURSDAY]: 'Jueves',
  [DayOfWeek.FRIDAY]: 'Viernes',
  [DayOfWeek.SATURDAY]: 'Sábado',
};

export const PERIOD_LABELS: Record<string, string> = {
  [TimePeriod.M1]: '08:00 - 10:00 (o Mañana)',
  [TimePeriod.M2]: '09:00 - 10:00',
  [TimePeriod.M3]: '10:00 - 12:00',
  [TimePeriod.M4]: '11:00 - 12:00',
  [TimePeriod.M5]: '12:00 - 13:00',
  [TimePeriod.M6]: '13:00 - 14:00',
  [TimePeriod.T1]: '14:00 - 16:00 (o Tarde)',
  [TimePeriod.T2]: '15:00 - 16:00',
  [TimePeriod.T3]: '16:00 - 18:00',
  [TimePeriod.T4]: '17:00 - 18:00',
  [TimePeriod.T5]: '18:00 - 19:00',
  [TimePeriod.T6]: '19:00 - 20:00',
  [TimePeriod.N1]: '19:00 - 21:00 (o Noche)',
  [TimePeriod.N2]: '20:00 - 21:00',
  [TimePeriod.N3]: '21:00 - 23:00',
  [TimePeriod.N4]: '22:00 - 23:00',
  [TimePeriod.N5]: '23:00 - 24:00',
  [TimePeriod.N6]: '24:00 - 01:00',
};

export function isTimePeriod(value: string): value is TimePeriod {
  return Object.values(TimePeriod).includes(value as TimePeriod);
}

export function isDayOfWeek(value: number): value is DayOfWeek {
  return value >= 1 && value <= 6;
}
