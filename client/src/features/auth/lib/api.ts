import { getAccessToken, setAccessToken, clearAccessToken } from "./auth";
import { useAuthStore } from "../store/auth-store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const REFRESH_ENDPOINT = `${API_URL}/auth/refresh`;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { accessToken?: string };
    if (!data?.accessToken) return null;

    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
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

  const refreshed = await refreshAccessToken();
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
