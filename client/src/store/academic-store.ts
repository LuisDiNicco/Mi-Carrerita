import { create } from 'zustand';
// Usar 'import type'
import type { Subject } from '../types/academic'; 

interface AcademicState {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  updateSubject: (subjectId: string, patch: Partial<Subject>) => void;
}

export const useAcademicStore = create<AcademicState>((set) => ({
  subjects: [],
  setSubjects: (subjects) => set({ subjects }),
  updateSubject: (subjectId, patch) =>
    set((state) => ({
      subjects: state.subjects.map((subject) =>
        subject.id === subjectId ? { ...subject, ...patch } : subject
      ),
    })),
}));