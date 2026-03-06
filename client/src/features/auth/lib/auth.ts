// El accessToken vive en memoria: no persiste entre recargas (eso es correcto,
// porque en cada recarga el browser renueva el token via /auth/refresh usando
// la cookie HttpOnly que maneja automáticamente).
// El refreshToken NUNCA toca JavaScript — es exclusivamente una cookie HttpOnly.
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
