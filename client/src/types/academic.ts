// client/src/types/academic.ts

// Reemplazamos enum con Object as const
export const SubjectStatus = {
  PENDIENTE: 'PENDIENTE',
  DISPONIBLE: 'DISPONIBLE',
  EN_CURSO: 'EN_CURSO',
  REGULARIZADA: 'REGULARIZADA',
  APROBADA: 'APROBADA',
} as const;

// Extraemos el tipo de los valores del objeto
export type SubjectStatus = (typeof SubjectStatus)[keyof typeof SubjectStatus];

export const CorrelativityCondition = {
  FINAL_APROBADO: 'FINAL_APROBADO',
  REGULAR_CURSADA: 'REGULAR_CURSADA',
} as const;

export type CorrelativityCondition = (typeof CorrelativityCondition)[keyof typeof CorrelativityCondition];

export interface Subject {
  id: string;
  planCode: string;
  name: string;
  semester: number;
  credits: number;
  isOptional?: boolean;
  status: SubjectStatus; 
  grade: number | null;
  statusDate?: string | null;
  notes?: string | null;
  requiredSubjectIds: string[];
}