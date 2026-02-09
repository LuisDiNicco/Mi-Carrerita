import { create } from 'zustand';
// Usar 'import type'
import type { Subject } from '../types/academic'; 

interface AcademicState {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
}

export const useAcademicStore = create<AcademicState>((set) => ({
  subjects: [],
  setSubjects: (subjects) => set({ subjects }),
}));