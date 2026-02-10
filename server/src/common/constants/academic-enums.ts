// server/src/common/enums/academic-enums.ts

// Es VITAL que sean String Enums (asignar = 'VALOR') para que coincidan con lo que se guarda en la DB.
export enum SubjectStatus {
  PENDIENTE = 'PENDIENTE',
  DISPONIBLE = 'DISPONIBLE',
  EN_CURSO = 'EN_CURSO',
  REGULARIZADA = 'REGULARIZADA',
  APROBADA = 'APROBADA',
}

export enum CorrelativityCondition {
  FINAL_APROBADO = 'FINAL_APROBADO',
  REGULAR_CURSADA = 'REGULAR_CURSADA',
}

export function isSubjectStatus(value: string): value is SubjectStatus {
  return Object.values(SubjectStatus).includes(value as SubjectStatus);
}