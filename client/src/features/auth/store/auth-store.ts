import { create } from "zustand";
import { clearAccessToken, setAccessToken } from "../lib/auth";
import { useAcademicStore } from "../../academic/store/academic-store";

export type AuthUser = {
  name: string;
  email: string;
};

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface AuthState {
  user: AuthUser | null;
  isGuest: boolean;
  /**
   * true once the startup token-refresh attempt has completed (success OR failure).
   * All authenticated sections MUST wait for this before mounting their data fetches.
   */
  authReady: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  continueAsGuest: () => void;
  hydrate: () => void;
  /**
   * Runs ONCE at app startup (called from App.tsx).
   * If localStorage has a logged-in user, silently tries to refresh the access token.
   * Sets authReady=true when done — regardless of success or failure.
   */
  initAuth: () => Promise<void>;
  isWakingUp: boolean;
  setWakingUp: (waking: boolean) => void;
}

const STORAGE_KEY = "mi-carrerita-user";
const GUEST_KEY = "mi-carrerita-guest";

const getInitialUserState = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const getInitialGuestState = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(GUEST_KEY) === "true" || !localStorage.getItem(STORAGE_KEY);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUserState(),
  isGuest: getInitialGuestState(),
  authReady: false,
  isWakingUp: false,

  setWakingUp: (waking) => set({ isWakingUp: waking }),

  initAuth: async () => {
    if (get().authReady) return; // Already initialized (e.g. right after login)

    const storedUser = localStorage.getItem(STORAGE_KEY);

    if (!storedUser) {
      // Guest — nothing to refresh. Ready immediately.
      useAcademicStore.getState().hydrateFromLocal();
      set({ authReady: true });
      return;
    }

    // There IS a stored user — try to silently refresh the token ONCE
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = (await response.json()) as { accessToken?: string };
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          try {
            const parsed = JSON.parse(storedUser) as AuthUser;
            set({ user: parsed, isGuest: false });
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          // Received 200 but no token — treat as expired
          _switchToGuest();
        }
      } else {
        // 401 — session expired. Gracefully switch to guest mode.
        _switchToGuest();
      }
    } catch {
      // Network error (server waking up) — don't erase the user from localStorage.
      // They'll get another chance to refresh when the server comes back.
      // Keep user visible in the header but don't trust any tokens.
    } finally {
      set({ authReady: true });
    }

    function _switchToGuest() {
      clearAccessToken();
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(GUEST_KEY, "true");
      useAcademicStore.getState().clearSubjects();
      set({ user: null, isGuest: true });
    }
  },

  login: (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(GUEST_KEY);
    useAcademicStore.getState().clearSubjects();
    set({ user, isGuest: false, authReady: true });
  },

  logout: () => {
    clearAccessToken();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
    useAcademicStore.getState().clearSubjects();
    set({ user: null, isGuest: true });
    window.dispatchEvent(new Event('auth:logout'));
  },

  continueAsGuest: () => {
    clearAccessToken();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(GUEST_KEY, "true");
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
    if (isGuest) {
      useAcademicStore.getState().hydrateFromLocal();
    }
  },
}));
