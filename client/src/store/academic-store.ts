import { create } from 'zustand';

// Esta interfaz es la que usa SubjectNode
export interface Subject {
  id: string;
  planCode: string;
  name: string;
  semester: number;
  credits: number;
  status: string; // 'PENDIENTE' | 'DISPONIBLE' | ...
  grade: number | null;
  requiredSubjectIds: string[];
}

interface AcademicState {
  subjects: Subject[];
  // Aquí agregaremos acciones después
}

export const useAcademicStore = create<AcademicState>(() => ({
  subjects: [],
}));