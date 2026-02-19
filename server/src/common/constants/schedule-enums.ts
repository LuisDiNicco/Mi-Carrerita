// Time periods for scheduling
export enum TimePeriod {
  AM = 'AM',
  PM = 'PM',
  EVENING = 'EVENING',
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
  [TimePeriod.AM]: 'Mañana (8-12)',
  [TimePeriod.PM]: 'Tarde (14-18)',
  [TimePeriod.EVENING]: 'Noche (19-23)',
};

export function isTimePeriod(value: string): value is TimePeriod {
  return Object.values(TimePeriod).includes(value as TimePeriod);
}

export function isDayOfWeek(value: number): value is DayOfWeek {
  return value >= 1 && value <= 6;
}
