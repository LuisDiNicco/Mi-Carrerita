# ❓ FAQ & Troubleshooting - Mi Carrerita

## 🔥 Problemas Frecuentes

### 1. Error: "Cannot GET /api/..."
**Problema:** El servidor no está corriendo

**Solución:**
```bash
cd server
npm run start:dev
```

Verifica que aparezca:
```
[NestFactory] Starting Nest application...
Application is running on: http://localhost:3000
```

---

### 2. Error: "EADDRINUSE :::3000"
**Problema:** El puerto 3000 ya está en uso

**Opciones:**
```bash
# Opción 1: Matar proceso en puerto 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Opción 2: Matar proceso en puerto 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Opción 3: Cambiar puerto en .env
# Modificar main.ts para usar puerto diferente
```

---

### 3. Error: "GOOGLE_CLIENT_ID is not configured"
**Problema:** Falta configurar credenciales de Google OAuth

**Solución:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Activa "Google+ API"
4. Crea credencial OAuth 2.0 (aplicación web)
5. Configura redirecciones:
   - URI autorizados: `http://localhost:3000`
   - URI callbacks: `http://localhost:3000/auth/google/callback`
6. Copia Client ID y Secret a `server/.env`:
```env
GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx123xxx
```

---

### 4. Error: "Cannot find module '@prisma/client'"
**Problema:** Prisma client no está generado

**Solución:**
```bash
cd server
npx prisma generate
```

---

### 5. Error: "Unauthorized" (401) en todas las requests
**Problema:** Token JWT expirado o inválido

**Opciones:**
1. Hacer logout y login nuevamente
2. Llamar a `/auth/refresh` para obtener nuevo token
3. Verificar que el refresh token en cookie no haya expirado (7 días)

---

### 6. Error: "Cannot find module 'react'"
**Problema:** Dependencias del cliente no instaladas

**Solución:**
```bash
cd client
npm install
```

Verifica `node_modules/` existe y contiene paquetes.

---

### 7. Error: "Unexpected token '<'" en navegador
**Problema:** Webpack/Vite está sirviendo un archivo HTML en lugar de JavaScript

**Causa típica:** Ruta de import incorrecta

**Solución:**
```typescript
// ❌ INCORRECTO
import { Button } from '../../components/button'

// ✅ CORRECTO (con .tsx si es un archivo)
import { Button } from '../../components/button.tsx'

// ✅ O con barrel export
import { Button } from '../../components'
```

---

### 8. Error de CORS: "Access to XMLHttpRequest has been blocked"
**Problema:** El cliente y servidor no están configurados correctamente

**Verificar:**
1. `server/.env` tiene `CLIENT_URL=http://localhost:5173`
2. `main.ts` habilita CORS:
```typescript
app.enableCors({
  origin: process.env.CLIENT_URL,
  credentials: true,
});
```

---

### 9. Error: "Failed to compile: SyntaxError"
**Problema:** Error de TypeScript no detectado

**Solución:**
```bash
cd client
npm run type-check

cd ../server
npm run type-check
```

---

### 10. Base de datos vacía o corrupta
**Problema:** Migración no se ejecutó correctamente

**Solución (⚠️ Reset completo):**
```bash
cd server

# Resetear base de datos completamente
npx prisma migrate reset

# O regenerar desde cero
rm dev.db
npx prisma migrate dev --name init
npx prisma db seed
```

---

## 💡 Preguntas Frecuentes

### ¿Cuál es la diferencia entre JWT y Refresh Token?

**JWT (Access Token)**
- Duración: 15 minutos
- Incluye: email, iat, exp
- Se envía en: `Authorization: Bearer <token>`
- Propósito: Autenticar requests

**Refresh Token**
- Duración: 7 días
- Almacenado en: httpOnly cookie
- Propósito: Generar nuevos JWT cuando expira

**Flujo:**
```
1. Usuario login → Obtiene JWT + Refresh Token
2. Usa JWT en requests
3. JWT expira → Usa Refresh Token para obtener nuevo JWT
4. Refresh Token expira → Usuario debe hacer login nuevamente
```

---

### ¿Por qué httpOnly cookie para Refresh Token?

**Seguridad:**
- No se envía automáticamente a cualquier request (XSRF protection)
- No accesible desde JavaScript (XSS protection)
- Solo se envía a `http://localhost:3000/auth/refresh`

**Alternativa (menos segura):**
```javascript
// ❌ No recomendado - vulnerable a XSS
localStorage.setItem('refreshToken', token);
```

---

### ¿Cómo agregar un nuevo endpoint?

**Pasos:**

1. **Crear DTO** (`server/src/modules/feature/dto/`)
```typescript
import { IsString, IsNumber } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  name: string;

  @IsNumber()
  value: number;
}
```

2. **Crear endpoint en Controller**
```typescript
import { Post, Body } from '@nestjs/common';

@Post()
create(@Body() dto: CreateFeatureDto) {
  return this.service.create(dto);
}
```

3. **Implementar lógica en Service**
```typescript
async create(dto: CreateFeatureDto) {
  return this.prisma.feature.create({
    data: dto,
  });
}
```

4. **Hacer request desde Cliente**
```typescript
const response = await authFetch('/api/feature', {
  method: 'POST',
  body: JSON.stringify({ name: 'test', value: 42 }),
});
```

---

### ¿Cómo agregar validación personalizada?

**Opción 1: Using class-validator**
```typescript
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;
}
```

**Opción 2: Custom decorator**
```typescript
// server/src/common/utils/validators.ts
export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        defaultMessage() {
          return 'Invalid email format';
        },
      },
    });
  };
}

// Usar:
export class LoginDto {
  @IsValidEmail()
  email: string;
}
```

---

### ¿Cómo agregar un nuevo subject a la carrera?

**Opción 1: Mediante API (futuro)**
```bash
POST /academic-career/subjects
Body: { codigo, nombre, creditos, dificultad }
```

**Opción 2: Editar archivo de datos**
```typescript
// server/src/data/plan-2023.ts
export const PLAN_2023_SUBJECTS = [
  {
    codigo: 'INF101',
    nombre: 'Programación I',
    creditos: 4,
    dificultad: 3,
  },
  // Agregar aquí...
];
```

Luego resetear BD:
```bash
npx prisma migrate reset
```

---

### ¿Cómo hacer deploy a producción?

**Frontend (Vercel):**
```bash
npm run build
# Vercel detecta automáticamente Next.js/Vite
# Output en ./dist
```

**Backend (Railway):**
```bash
# Definir variables de entorno en dashboard:
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CLIENT_URL=https://tudominio.vercel.app

# Railway ejecuta automáticamente:
npm install
npm run build
npm start
```

---

### ¿Cómo escalar a muchos usuarios?

**Base de datos:**
- Cambiar de SQLite a PostgreSQL
- Agregar índices en campos frecuentes
- Implementar connection pooling

**Backend:**
- Agregar caching con Redis
- Rate limiting
- Implementar paginación

**Frontend:**
- Code splitting
- Lazy loading
- Service worker / offline support

---

### ¿Puedo usar esta app offline?

**Actualmente:** No, requiere conexión al servidor

**Futuro:**
- Agregar Service Worker
- Persistir datos en IndexedDB
- Sincronizar cuando vuelva conexión

---

### ¿Cómo cambio el tema de colores?

**Opción 1: Editar variables CSS**
```typescript
// client/src/shared/styles/design-system-retro.ts
export const colors = {
  primary: '#ff6b6b',    // Rojo
  secondary: '#4ecdc4',  // Teal
  // ... más colores
};
```

**Opción 2: Usar Tailwind config**
```javascript
// client/tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
    },
  },
};
```

---

## 🐛 Reporte de Bugs

Si encuentras un bug:

1. **Verifica que tengas las últimas versiones:**
   ```bash
   npm install
   npx prisma generate
   npm run type-check
   ```

2. **Intenta reproducir el problema:**
   - Pasos exactos
   - Navegador y versión
   - Terminal output completo

3. **Abre un issue en GitHub** con:
   - Descripción del problema
   - Pasos para reproducir
   - Output de error
   - Tu entorno (Node v, OS, etc.)

---

## 📞 Soporte

- **Documentación:** Consulta [SETUP.md](SETUP.md), [API.md](API.md)
- **Arquitectura:** Ver [ARCHITECTURE.md](ARCHITECTURE.md)
- **Swagger UI:** http://localhost:3000/api/docs
- **Issues:** Abre un ticket en GitHub

---

## 🚀 Tips de Desarrollo

### 1. Hot Reload
Ambos servidores reinician automáticamente:
```bash
cd server && npm run start:dev   # Watch mode
cd client && npm run dev         # Hot module replacement
```

### 2. Debug con VS Code

**Servidor:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "NestJS",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/server/node_modules/@nestjs/cli/bin/nest.js",
      "args": ["start", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 3. Inspeccionar Base de Datos
```bash
cd server
npx prisma studio  # Abre interfaz gráfica en http://localhost:5555
```

### 4. Ver logs de red
```typescript
// Agregar en client/src/features/auth/lib/api.ts
export const authFetch = async (url, options = {}) => {
  console.log('→ REQUEST:', method.toUpperCase(), url, options);
  const response = await fetch(url, options);
  console.log('← RESPONSE:', response.status, await response.clone().json());
  return response;
};
```

---

**¿Aún tienes problemas? Abre un issue o un PR con tu pregunta. ¡Feliz coding! 🔧**
