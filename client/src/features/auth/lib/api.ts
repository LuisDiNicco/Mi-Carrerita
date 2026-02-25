import { getAccessToken, setAccessToken, clearAccessToken, getRefreshToken, setRefreshToken, clearRefreshToken } from "./auth";
import { useAuthStore } from "../store/auth-store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const REFRESH_ENDPOINT = `${API_URL}/auth/refresh`;
let refreshPromise: Promise<string | null> | null = null;

function extractApiMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (Array.isArray(payload)) {
    const messages = payload
      .map((item) => (typeof item === 'string' ? item : ''))
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    return extractApiMessage((payload as { message?: unknown }).message, fallback);
  }

  return fallback;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const token = getRefreshToken();
    const response = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: token }),
    });

    if (!response.ok) {
      clearRefreshToken();
      return null;
    }

    const data = (await response.json()) as { accessToken?: string; refreshToken?: string };
    if (!data?.accessToken) return null;

    setAccessToken(data.accessToken);
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    return data.accessToken;
  } catch {
    return null;
  }
}

async function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers ?? {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await getRefreshedToken();
  if (!refreshed) {
    clearAccessToken();
    useAuthStore.getState().logout();
    return response;
  }

  const retryHeaders = new Headers(init?.headers ?? {});
  retryHeaders.set("Authorization", `Bearer ${refreshed}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: "include",
  });
}
/**
 * Register a new user with email and password
 */
export async function registerUser(dto: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ accessToken: string; user: { id: string; email: string; name?: string | null; avatarUrl?: string | null } }> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      extractApiMessage(
        errorData,
        'No se pudo crear la cuenta. Revisá los datos e intentá nuevamente.',
      ),
    );
  }

  const data = await response.json();
  setAccessToken(data.accessToken);
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  return data;
}

/**
 * Login user with email and password
 */
export async function loginUser(dto: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; user: { id: string; email: string; name?: string | null; avatarUrl?: string | null } }> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      extractApiMessage(
        errorData,
        'No se pudo iniciar sesión. Verificá tu correo y contraseña.',
      ),
    );
  }

  const data = await response.json();
  setAccessToken(data.accessToken);
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  return data;
}