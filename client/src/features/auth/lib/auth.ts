let accessToken: string | null = null;
let refreshToken: string | null = null;
const REFRESH_TOKEN_KEY = 'refreshToken';

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
  if (token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getRefreshToken() {
  if (!refreshToken) {
    refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return refreshToken;
}

export function clearRefreshToken() {
  refreshToken = null;
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
