# ✅ Pre-Launch Checklist - Mi Carrerita

## 🚀 Antes de Empezar a Desarrollar

Verifica que todos estos puntos están completados:

### 📝 Documentación
- [x] README.md actualizado
- [x] SETUP.md con instrucciones completas
- [x] QUICKSTART.md para inicio rápido
- [x] API.md con todos los endpoints
- [x] ARCHITECTURE.md con diagrama del proyecto
- [x] FAQ.md con problemas comunes
- [x] CONTRIBUTING.md para colaboradores
- [x] ROADMAP.md con futuro del proyecto
- [x] Este checklist

### 🛠️ Configuración
- [x] `.env` creados (client y server)
- [x] Node.js 18+ instalado (`node --version`)
- [x] npm actualizado (`npm --version`)
- [x] Dependencias instaladas (`npm install` en ambas carpetas)
- [x] Prisma generado (`npx prisma generate`)
- [x] Database inicializada (`npx prisma migrate dev`)

### 🔐 Seguridad
- [x] Google OAuth credentials obtenidas
- [x] Variables de entorno configuradas correctamente
- [x] `.env` agregado a `.gitignore` (no commitear secrets)
- [x] JWT secrets generados (ver `generate-secrets.ps1`)
- [x] HTTPS habilitado para producción

### ✨ Funcionalidad
- [x] Login con Google funciona
- [x] Tokens JWT se generan correctamente
- [x] Refresh token funciona
- [x] Carrera se visualiza en el grafo
- [x] Historial académico se puede actualizar
- [x] Recomendaciones se calculan
- [x] Dashboard muestra estadísticas

### 🧪 Calidad de Código
- [x] No hay errores de TypeScript (`npm run type-check`)
- [x] No hay warnings en el compilador
- [x] Código formateado consistentemente
- [x] Archivos tienen comentarios donde necesario
- [x] Tipos están bien definidos

### 🗄️ Base de Datos
- [x] Tablas creadas (User, Subject, AcademicRecord, etc.)
- [x] Índices creados para performance
- [x] Seed data cargado (21 asignaturas)
- [x] Usuario admin existe (`user@admin`)
- [x] Relaciones (correlatividades) funcionan

### 🌐 API
- [x] CORS configurado correctamente
- [x] Swagger/OpenAPI documentación disponible
- [x] Endpoints responden correctamente
- [x] Validación de DTOs funciona
- [x] Error handling implementado

### 📱 Frontend
- [x] Componentes React renderean sin errores
- [x] Zustand stores funcionan
- [x] authFetch wrapper intercambia tokens
- [x] Almacenamiento de tokens seguro
- [x] Logout limpia estado correctamente

### 🔄 Integración
- [x] Cliente se conecta al servidor sin errores CORS
- [x] Requests incluyen Authorization header
- [x] Refresh token se usa automáticamente
- [x] Login flow completo funciona
- [x] Logout limpia tokens e estado

---

## 🎯 Antes de Hacer Push

```bash
# 1. Verifica compile errors
npm run type-check

# 2. Verifica linting
npm run lint

# 3. Construye para producción
npm run build

# 4. Cleaning
git status  # No .env files!
git clean -fd
```

---

## 🚀 Startup Commands

### Terminal 1: Backend
```bash
cd server
npm run start:dev
```

**Verifica que aparezca:**
```
[NestFactory] Starting Nest application...
✔ Generated Prisma Client
Application is running on: http://localhost:3000
```

### Terminal 2: Frontend
```bash
cd client
npm run dev
```

**Verifica que aparezca:**
```
  ➜  Local:   http://localhost:5173/
```

### Terminal 3: (Opcional) Prisma Studio
```bash
cd server
npx prisma studio
```

Accede en: http://localhost:5555

---

## 📋 Testing Checklist

### Manual Testing

- [ ] Abre http://localhost:5173
- [ ] Haz click en "Login with Google"
- [ ] Selecciona tu cuenta de Google
- [ ] Completa el OAuth flow
- [ ] Se redirige a dashboard
- [ ] Tu nombre aparece en el header
- [ ] Carrera se visualiza correctamente
- [ ] Puedes actualizar asignaturas
- [ ] Dashboard muestra datos
- [ ] Recomendaciones se cargan
- [ ] Trophies se muestran
- [ ] Haz logout - se limpia estado
- [ ] Login nuevamente - sesión se restaura

### API Testing (Swagger)

- [ ] Abre http://localhost:3000/api/docs
- [ ] Puedes autorizar con token
- [ ] Endpoints están documentados
- [ ] Pruebas interactivas funcionan

---

## 🔍 Pre-Push Verification

```bash
# 1. Git status limpio
git status

# 2. Sin archivos .env o secrets
git ls-files | grep "\.env"  # Debería estar vacío

# 3. Commits seguem SemVer
# feat: ...
# fix: ...
# docs: ...

# 4. Messages en inglés (recomendado)

# 5. Sin commented code
grep -r "^\s*//\s*const\|^\s*//\s*function" src/

# 6. Sin console.log en producción
grep -r "console.log" src/
```

---

## 📦 Deployment Ready

### Frontend
- [x] `.next` o `dist/` en `.gitignore`
- [x] Environment variables documentadas
- [x] Build completa sin errores
- [x] Static assets optimizados
- [x] No hardcoded URLs (usar env vars)

### Backend
- [x] `node_modules` en `.gitignore`
- [x] `.env` en `.gitignore`
- [x] `dev.db` en `.gitignore`
- [x] Build completa (`npm run build`)
- [x] Scripts `start:prod` funcionan

### Database
- [x] Migrations versionadas
- [x] Seeds funcionan de manera idempotente
- [x] Connection pooling configurado
- [x] Backups automáticos planeados

---

## 🔐 Production Checklist

**NO HACER DEPLOY sin:**

- [ ] Secretos reales configurados
- [ ] HTTPS habilitado
- [ ] CORS restrictivo (solo tu dominio)
- [ ] Rate limiting implementado
- [ ] Logging y monitoring activo
- [ ] Backups automáticos
- [ ] Error tracking (Sentry)
- [ ] CDN para assets estáticos

---

## 📞 Soporte & Recursos

Si tienes dudas:
- Consulta [SETUP.md](SETUP.md)
- Revisa [FAQ.md](FAQ.md)
- Abre un issue en GitHub
- Pregunta en [Discussions](https://github.com/usuario/Mi-Carrerita/discussions)

---

## 🎉 ¡Estás Listo!

Si completaste todo:
1. **Haz tu primer commit**
2. **Sube a GitHub**
3. **¡Comparte con amigos!**
4. **Recolecta feedback**
5. **Itera y mejora**

---

**Última revisión:** Enero 2024

**Actualiza este checklist a medida que el proyecto evoluciona.** ✅
