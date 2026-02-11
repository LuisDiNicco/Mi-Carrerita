# 📚 API Endpoints - Mi Carrerita

## 🔐 Autenticación (Auth)

### 1. Iniciar Login con Google
**GET** `/auth/google`

Redirige a Google OAuth. No requiere autenticación.

**Respuesta:**
- Redirige a Google login
- Luego redirige a callback con parámetro `code`

---

### 2. Callback de Google OAuth
**GET** `/auth/google/callback?code=...`

Llamado automáticamente por Google después de que el usuario autoriza.

**Parámetros Query:**
- `code` (string): Código de autorización de Google

**Respuesta (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Cookies:**
- `refresh_token`: Token de refresco (httpOnly, secure)

---

### 3. Obtener Usuario Actual
**GET** `/auth/me`

Requiere JWT en header `Authorization: Bearer <token>`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Respuesta (200):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "John Doe",
  "googleId": "google-id-123"
}
```

**Respuesta (401):**
```json
{
  "message": "Unauthorized"
}
```

---

### 4. Refrescar Token de Acceso
**POST** `/auth/refresh`

Usa el refresh token en cookie para obtener nuevo access token.

**Headers:**
- Cookie: `refresh_token=...`

**Respuesta (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 900
}
```

**Respuesta (401):**
```json
{
  "message": "Invalid or expired refresh token"
}
```

---

### 5. Logout
**POST** `/auth/logout`

Invalida los tokens y limpia cookies.

**Respuesta (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 🎓 Carrera Académica (Academic Career)

### 1. Obtener Grafo de Carrera
**GET** `/academic-career/graph`

Requiere JWT.

**Headers:**
- `Authorization: Bearer <accessToken>`

**Respuesta (200):**
```json
{
  "subjects": [
    {
      "id": "uuid",
      "código": "INF101",
      "nombre": "Programación I",
      "estado": "DISPONIBLE",
      "creditos": 4,
      "correlatividades": ["INF100"],
      "dificultad": 3,
      "calificacion": null
    }
  ],
  "correlativities": [
    {
      "subjectId": "uuid-1",
      "prerequisiteId": "uuid-2",
      "type": "MANDATORY"
    }
  ]
}
```

---

### 2. Actualizar Registro Académico
**PATCH** `/academic-career/subjects/:subjectId`

Actualiza estado, calificación, dificultad y notas de una asignatura.

**Headers:**
- `Authorization: Bearer <accessToken>`

**Body:**
```json
{
  "estado": "APROBADA",
  "calificacion": 8.5,
  "dificultad": 4,
  "notas": "Muy buena materia"
}
```

**Parámetros:**
- `estado` (string, opcional): PENDIENTE, DISPONIBLE, EN_CURSO, REGULARIZADA, APROBADA, REPROBADA
- `calificacion` (number, opcional): 0-10
- `dificultad` (number, opcional): 1-5
- `notas` (string, opcional): Texto libre

**Respuesta (200):**
```json
{
  "id": "uuid",
  "subjectId": "uuid",
  "estado": "APROBADA",
  "calificacion": 8.5,
  "dificultad": 4,
  "notas": "Muy buena materia",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Respuesta (404):**
```json
{
  "message": "Subject not found"
}
```

---

## 🔑 Autenticación de Endpoints

### Bearer Token (JWT)

Todos los endpoints excepto `/auth/google` y `/auth/google/callback` requieren:

```
Authorization: Bearer <accessToken>
```

**Token Expiration:**
- Access Token: 15 minutos
- Refresh Token: 7 días

Si el access token expira, usa `/auth/refresh` para obtener uno nuevo.

---

## 📄 Códigos de Respuesta

| Código | Significado |
|--------|------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Validación fallida |
| 401 | Unauthorized - No autenticado o token inválido |
| 403 | Forbidden - No tiene permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: duplicado) |
| 500 | Internal Server Error - Error del servidor |

---

## 🧪 Pruebas con cURL

### Login con Google
```bash
# Abre en navegador (se redirige automáticamente)
curl -L "http://localhost:3000/auth/google"
```

### Obtener Usuario Actual
```bash
curl -H "Authorization: Bearer <tu-access-token>" \
  http://localhost:3000/auth/me
```

### Refrescar Token
```bash
curl -X POST \
  -H "Cookie: refresh_token=<tu-refresh-token>" \
  http://localhost:3000/auth/refresh
```

### Obtener Grafo de Carrera
```bash
curl -H "Authorization: Bearer <tu-access-token>" \
  http://localhost:3000/academic-career/graph
```

### Actualizar Asignatura
```bash
curl -X PATCH \
  -H "Authorization: Bearer <tu-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "APROBADA",
    "calificacion": 9.0,
    "dificultad": 4,
    "notas": "Excelente materia"
  }' \
  http://localhost:3000/academic-career/subjects/<subject-uuid>
```

---

## 📚 Documentación Interactiva

Accede a la documentación Swagger completa en:
```
http://localhost:3000/api/docs
```

Desde allí puedes:
- Ver todos los endpoints
- Probar directamente desde el navegador
- Autenticarte con tus tokens
- Ver esquemas de respuesta

---

## 🔄 Flujo de Autenticación

```
1. Usuario hace clic en "Login with Google"
   ↓
2. Redirige a /auth/google
   ↓
3. Redirige a Google login
   ↓
4. Usuario autoriza
   ↓
5. Google redirige a /auth/google/callback?code=...
   ↓
6. Servidor crea JWT y refresh token
   ↓
7. Redirige al cliente con accessToken
   ↓
8. Cliente almacena accessToken
   ↓
9. Requests futuros incluyen: Authorization: Bearer <accessToken>
   ↓
10. Si Token expira → Llamar /auth/refresh
   ↓
11. Obtener nuevo accessToken
```

---

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `GOOGLE_CLIENT_ID not configured` | Falta credencial OAuth | Agregar a `server/.env` |
| `Invalid or expired refresh token` | Token expiró (7 días) | Login nuevamente |
| `Unauthorized` | Access token inválido/expirado | Llamar `/auth/refresh` |
| `Subject not found` | UUID incorrecto | Verificar con `/academic-career/graph` |

---

## 🚀 Rate Limiting (Próximamente)

Actualmente sin rate limiting. Próximas versiones:
- 100 requests por minuto por IP
- 1000 requests por hora por usuario
