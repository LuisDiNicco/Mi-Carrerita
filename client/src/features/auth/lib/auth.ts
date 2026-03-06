// El accessToken vive en memoria: no persiste entre recargas de página.
// Al recargar, se renueva automáticamente via POST /auth/refresh usando
// la cookie HttpOnly que el browser adjunta automáticamente.
// El refreshToken NUNCA es accesible desde JavaScript — solo via cookie HttpOnly.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}
