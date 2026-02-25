import { create } from "zustand";
import type { Subject } from "../../../shared/types/academic";

const ACADEMIC_STORAGE_KEY = "mi-carrerita-academic-guest";
const USER_STORAGE_KEY = "mi-carrerita-user";

interface AcademicState {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  setSubjectsFromServer: (subjects: Subject[]) => void;
  updateSubject: (subjectId: string, patch: Partial<Subject>) => void;
  clearSubjects: () => void;
  hydrateFromLocal: () => void;
  saveToLocal: (subjects: Subject[]) => void;
  clearLocal: () => void;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  subjects: [],
  
  
  // Para invitados: setSubjects GUARDA en localStorage
  setSubjects: (subjects) => {
    set({ subjects });
    // Auto-save solo para invitados
    get().saveToLocal(subjects);
  },
  // Para usuarios loguetados: setSubjectsFromServer NO guarda en localStorage
  setSubjectsFromServer: (subjects) => {
    set({ subjects });
    // NO guardamos en localStorage cuando viene del servidor
  },
  updateSubject: (subjectId, patch) =>
    set((state) => {
      const updated = state.subjects.map((subject) =>
        subject.id === subjectId ? { ...subject, ...patch } : subject,
      );
      // Auto-save al actualizar (solo invitados guardan)
      get().saveToLocal(updated);
      return { subjects: updated };
    }),
  clearSubjects: () => {
    set({ subjects: [] });
    get().clearLocal();
  },
  hydrateFromLocal: () => {
    try {
      const stored = sessionStorage.getItem(ACADEMIC_STORAGE_KEY);
      if (stored) {
        const subjects = JSON.parse(stored) as Subject[];
        set({ subjects });
      }
    } catch {
      // Si hay error, ignorar y continuar con estado vacío
      sessionStorage.removeItem(ACADEMIC_STORAGE_KEY);
    }
  },
  saveToLocal: (subjects) => {
    try {
      const isLoggedIn = Boolean(localStorage.getItem(USER_STORAGE_KEY));
      if (isLoggedIn) {
        return;
      }

      const uniqueSubjects = Array.from(
        new Map(subjects.map((subject) => [subject.id, subject])).values(),
      );

      if (uniqueSubjects.length === 0) {
        sessionStorage.removeItem(ACADEMIC_STORAGE_KEY);
        return;
      }

      sessionStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(uniqueSubjects));
    } catch {
      console.warn('No se pudo guardar datos académicos en sessionStorage');
    }
  },
  clearLocal: () => {
    try {
      sessionStorage.removeItem(ACADEMIC_STORAGE_KEY);
    } catch {
      console.warn('No se pudo limpiar datos académicos de sessionStorage');
    }
  },
}));

