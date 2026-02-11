import { create } from "zustand";

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
    set({ user, isGuest: false });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
    set({ user: null, isGuest: true });
  },
  continueAsGuest: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
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
    set({ user: null, isGuest: guest || true });
  },
}));
