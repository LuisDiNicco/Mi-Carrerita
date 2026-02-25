import { create } from "zustand";
import { clearAccessToken, clearRefreshToken } from "../lib/auth";
import { useAcademicStore } from "../../academic/store/academic-store";

export type AuthUser = {
  name: string;
  email: string;
};

interface AuthState {
  user: AuthUser | null;
  isGuest: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  continueAsGuest: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "mi-carrerita-user";
const GUEST_KEY = "mi-carrerita-guest";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isGuest: true,
  login: (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(GUEST_KEY);
    // IMPORTANTE: Limpiar localStorage académico al loguearse
    // El usuario loguetado cargará sus datos desde el servidor
    useAcademicStore.getState().clearLocal();
    useAcademicStore.getState().clearSubjects();
    set({ user, isGuest: false });
  },
  logout: () => {
    clearAccessToken();
    clearRefreshToken();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
    // Limpiar datos académicos al logout
    useAcademicStore.getState().clearLocal();
    useAcademicStore.getState().clearSubjects();
    set({ user: null, isGuest: true });
    // Emit event for global cleanup (e.g., academic store)
    window.dispatchEvent(new Event('auth:logout'));
  },
  continueAsGuest: () => {
    clearAccessToken();
    clearRefreshToken();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
    // Limpiar para empezar como invitado "limpio"
    useAcademicStore.getState().clearLocal();
    useAcademicStore.getState().clearSubjects();
    set({ user: null, isGuest: true });
  },
  hydrate: () => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const guest = localStorage.getItem(GUEST_KEY) === "true";
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        set({ user: parsed, isGuest: false });
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const isGuest = guest || !storedUser;
    set({ user: null, isGuest });
    
    // Si es invitado, cargar datos académicos desde sessionStorage
    if (isGuest) {
      useAcademicStore.getState().hydrateFromLocal();
    }
  },
}));
