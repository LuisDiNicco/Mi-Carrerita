// server/src/common/constants/academic-status.ts

export const SUBJECT_STATUS = {
  PENDIENTE: 'PENDIENTE',
  DISPONIBLE: 'DISPONIBLE',
  EN_CURSO: 'EN_CURSO',
  REGULARIZADA: 'REGULARIZADA',
  APROBADA: 'APROBADA',
} as const;

export type SubjectStatusType = keyof typeof SUBJECT_STATUS;

export const REQUIREMENT_TYPE = {
  REGULAR: 'REGULAR_CURSADA',
  FINAL: 'FINAL_APROBADO',
} as const;