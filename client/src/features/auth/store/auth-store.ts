import { create } from "zustand";
import { clearAccessToken, setAccessToken } from "../lib/auth";
import { useAcademicStore } from "../../academic/store/academic-store";

export type AuthUser = {
  name: string;
  email: string;
};

interface AuthState {
  user: AuthUser | null;
  isGuest: boolean;
  isHydrating: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  continueAsGuest: () => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = "mi-carrerita-user";
const GUEST_KEY = "mi-carrerita-guest";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isGuest: true,
  isHydrating: true, // true hasta que hydrate() complete — evita fetches prematuros
  login: (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(GUEST_KEY);
    // Clear any guest academic progress — logged-in user loads from server
    useAcademicStore.getState().clearSubjects();
    set({ user, isGuest: false });
  },
  logout: () => {
    clearAccessToken();
    // La cookie HttpOnly refresh_token la limpia el backend via POST /auth/logout
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
    // Clear academic data — next session starts as clean guest
    useAcademicStore.getState().clearSubjects();
    set({ user: null, isGuest: true });
    window.dispatchEvent(new Event('auth:logout'));
  },
  continueAsGuest: () => {
    clearAccessToken();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
    // Start fresh as guest with no academic data
    useAcademicStore.getState().clearSubjects();
    set({ user: null, isGuest: true });
  },
  hydrate: async () => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const guest = localStorage.getItem(GUEST_KEY) === "true";

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;

        // Hay sesión guardada: intentar renovar el access token ANTES de que
        // cualquier componente haga fetch. Esto evita la race condition donde
        // los componentes disparan requests con accessToken = null.
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include", // El browser adjunta la cookie HttpOnly
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json() as { accessToken?: string };
            if (data?.accessToken) {
              setAccessToken(data.accessToken);
              set({ user: parsed, isGuest: false, isHydrating: false });
              return;
            }
          }
          // El refresh falló (cookie expirada o no existe) → limpiar sesión
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(GUEST_KEY);
          localStorage.setItem(GUEST_KEY, "true");
          set({ user: null, isGuest: true, isHydrating: false });
          useAcademicStore.getState().hydrateFromLocal();
          return;
        } catch {
          // Error de red — limpiar estado por seguridad
          localStorage.removeItem(STORAGE_KEY);
          set({ user: null, isGuest: true, isHydrating: false });
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const isGuest = guest || !storedUser;
    set({ user: null, isGuest, isHydrating: false });

    // Si es invitado, cargar datos académicos desde sessionStorage
    if (isGuest) {
      useAcademicStore.getState().hydrateFromLocal();
    }
  },
}));
