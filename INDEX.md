# 📚 Documentation Index - Mi Carrerita

Bienvenido a la documentación de **Mi Carrerita**. Aquí encontrarás todo lo que necesitas para entender, configurar y desarrollar el proyecto.

---

## 🚀 Comenzar Ahora (5 minutos)

👉 **[QUICKSTART.md](QUICKSTART.md)** - La forma más rápida de empezar

---

## 📖 Documentación Principal

### Para Usuarios
- **[README.md](README.md)** - Descripción general del proyecto

### Para Desarrollo
- **[SETUP.md](SETUP.md)** - Guía completa de instalación y configuración
- **[API.md](API.md)** - Documentación de todos los endpoints REST
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Diseño técnico y patrones
- **[FAQ.md](FAQ.md)** - Preguntas frecuentes y troubleshooting

### Para Colaboración
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guía para contribuidores
- **[ROADMAP.md](ROADMAP.md)** - Plan futuro del proyecto
- **[CHECKLIST.md](CHECKLIST.md)** - Verificaciones pre-launch

### Resúmenes
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Lo que se completó en este proyecto

---

## 🎯 Selecciona tu Rol

### 👨‍💻 Desarrollador
1. Lee [QUICKSTART.md](QUICKSTART.md)
2. Sigue pasos en [SETUP.md](SETUP.md)
3. Consulta [ARCHITECTURE.md](ARCHITECTURE.md) para entender estructura
4. Usa [API.md](API.md) para saber qué endpoints existen
5. Abre [Swagger UI](http://localhost:3000/api/docs) para pruebas interactivas

### 🔍 QA / Tester
1. Lee [CHECKLIST.md](CHECKLIST.md) para testing checklist
2. Usa [FAQ.md](FAQ.md) para reportar issues conocidos
3. Abre issues en GitHub con detalles de bugs

### 📚 Diseñador
1. Revisa [ARCHITECTURE.md](ARCHITECTURE.md) sección "Design System"
2. Explora componentes en `client/src/shared/ui/`
3. Modifica colores en `client/src/shared/styles/design-system-retro.ts`

### 🤝 Colaborador
1. Lee [CONTRIBUTING.md](CONTRIBUTING.md)
2. Revisa [ROADMAP.md](ROADMAP.md) para ideas
3. Abre un issue o PR en GitHub

---

## 🚨 Problemas Comunes

¿Error en la instalación?
→ Consulta [FAQ.md](FAQ.md) - Troubleshooting Rápido

¿No sabes cómo hacer algo?
→ Consulta [FAQ.md](FAQ.md) - Preguntas Frecuentes

¿Quieres entender la arquitectura?
→ Lee [ARCHITECTURE.md](ARCHITECTURE.md)

¿Necesitas documentación de APIs?
→ Abre [API.md](API.md) o [Swagger UI](http://localhost:3000/api/docs)

---

## 📂 Estructura de Archivos

```
/
├── 📖 README.md                ← Overview del proyecto
├── 🚀 QUICKSTART.md            ← Inicio en 5 minutos
├── ⚙️  SETUP.md                ← Configuración completa
├── 🌐 API.md                   ← Documentación de endpoints
├── 🏗️  ARCHITECTURE.md         ← Diseño técnico
├── ❓ FAQ.md                   ← Preguntas frecuentes
├── 🤝 CONTRIBUTING.md          ← Guía de contribución
├── 🗺️  ROADMAP.md             ← Plan futuro
├── ✅ CHECKLIST.md             ← Verificaciones
├── 📊 PROJECT_SUMMARY.md       ← Resumen de lo completado
├── 📚 THIS FILE (INDEX.md)     ← Mapa de documentación
│
├── client/                     ← Frontend React
├── server/                     ← Backend NestJS
│
├── docker-compose.yml          ← Contenedores (producción)
├── .env                        ← Variables globales
├── generate-secrets.ps1        ← Script secretos (Windows)
└── generate-secrets.sh         ← Script secretos (Linux/Mac)
```

---

## 🔄 Flujo de Lectura Recomendado

### Fase 1: Entender el Proyecto (15 min)
1. [README.md](README.md) - Qué es Mi Carrerita
2. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Lo que se completó

### Fase 2: Configurar Ambiente (15 min)
1. [QUICKSTART.md](QUICKSTART.md) - Pasos rápidos
2. [SETUP.md](SETUP.md) - Configuración detallada

### Fase 3: Empezar a Desarrollar (30 min)
1. [ARCHITECTURE.md](ARCHITECTURE.md) - Entender la estructura
2. Explorar carpetas `client/src/` y `server/src/`
3. Abrir [Swagger UI](http://localhost:3000/api/docs)

### Fase 4: Contribuir (según necesidad)
1. [CONTRIBUTING.md](CONTRIBUTING.md) - Cómo contribuir
2. [ROADMAP.md](ROADMAP.md) - Qué necesita trabajo
3. Crear issue o PR en GitHub

---

## 🔑 Puntos Clave

### Antes de Empezar
- ✅ Node.js 18+ instalado
- ✅ npm actualizado
- ✅ Google OAuth credentials (obtener en [Google Cloud Console](https://console.cloud.google.com/))

### Primeros Comandos
```bash
# 1. Configurar variables de entorno
# Editar server/.env y client/.env

# 2. Iniciar backend
cd server && npm run start:dev

# 3. En otra terminal, iniciar frontend
cd client && npm run dev

# 4. Abrir navegador
# http://localhost:5173
```

### Documentación Interactiva
- Swagger API Docs: http://localhost:3000/api/docs
- Prisma Studio: `npx prisma studio` (http://localhost:5555)

---

## 🔑 Variables de Entorno

### Server (.env)
```env
DATABASE_URL=file:./dev.db
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
JWT_SECRET=tu-secret
JWT_REFRESH_SECRET=tu-refresh-secret
```

### Client (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=tu-client-id
```

**Generar secretos:**
```bash
# Windows
.\generate-secrets.ps1

# Linux/Mac
bash generate-secrets.sh
```

---

## 📊 Tabla de Contenidos Completa

| Documento | Propósito | Tiempo |
|-----------|-----------|--------|
| [README.md](README.md) | Overview | 5 min |
| [QUICKSTART.md](QUICKSTART.md) | Setup rápido | 5 min |
| [SETUP.md](SETUP.md) | Setup completo | 20 min |
| [API.md](API.md) | Documentación de APIs | 15 min |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Diseño técnico | 30 min |
| [FAQ.md](FAQ.md) | Troubleshooting | Según sea |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo contribuir | 10 min |
| [ROADMAP.md](ROADMAP.md) | Plan futuro | 10 min |
| [CHECKLIST.md](CHECKLIST.md) | Pre-launch | 15 min |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Resumen completitud | 10 min |

**Total: ~2 horas de lectura para dominar el proyecto.**

---

## 🆘 Necesitas Ayuda?

### "No sé por dónde empezar"
→ Lee [QUICKSTART.md](QUICKSTART.md)

### "Tengo un error"
→ Busca en [FAQ.md](FAQ.md)

### "No entiendo la arquitectura"
→ Lee [ARCHITECTURE.md](ARCHITECTURE.md)

### "Quiero contribuir"
→ Lee [CONTRIBUTING.md](CONTRIBUTING.md)

### "¿Cuál es el plan futuro?"
→ Lee [ROADMAP.md](ROADMAP.md)

### "¿Todo está listo?"
→ Revisa [CHECKLIST.md](CHECKLIST.md)

---

## 🚀 Comandos Rápidos

```bash
# Setup
npm install                       # Instala dependencias (hacer en ambas carpetas)
npx prisma generate             # Genera tipos Prisma
npx prisma migrate dev          # Crea tablas y seed

# Desarrollo
npm run start:dev               # Backend: watch mode
npm run dev                     # Frontend: hot reload
npx prisma studio              # Ver base de datos (UI)

# Verificación
npm run type-check              # Busca errores TypeScript
npm run build                   # Build para producción
npm run lint                    # Linting (ESLint)

# Secretos
.\generate-secrets.ps1          # Windows: generar secretos
bash generate-secrets.sh        # Linux/Mac: generar secretos
```

---

## 🎓 Stack Tecnológico

**Frontend:** React 18 + TypeScript + Vite + Zustand + Tailwind CSS + React Flow + Recharts

**Backend:** NestJS 11 + TypeScript + Prisma + Passport.js + JWT

**Database:** SQLite (dev) / PostgreSQL (producción)

**DevOps:** Node.js + npm + Docker (opcional)

---

## 📞 Contacto & Soporte

- **Issues:** Abre un ticket en GitHub
- **Discussions:** Pregunta en GitHub Discussions
- **Documentación:** Consulta los archivos `.md` en la raíz

---

## 📋 Checklist Rápido

- [ ] Tengo Node.js 18+
- [ ] Leí [QUICKSTART.md](QUICKSTART.md)
- [ ] Configuré las variables de entorno
- [ ] Obtuve credenciales de Google OAuth
- [ ] Ejecuté `npm install` en ambas carpetas
- [ ] Ejecuté `npx prisma migrate dev` en server/
- [ ] Ejecuté `npm run start:dev` en server/
- [ ] Ejecuté `npm run dev` en client/
- [ ] Abrí http://localhost:5173 en el navegador
- [ ] Hice login exitosamente

---

## 🎉 ¡Ya Estás Listo!

Siguiente paso: **[QUICKSTART.md](QUICKSTART.md)** → 5 minutos y estarás desarrollando.

---

**Última actualización:** Enero 2024  
**Versión:** 1.0.0  
**Estado:** ✅ Completado

---

*Navega entre documentos usando los links en Markdown. Si esta es tu primera vez, comienza con [QUICKSTART.md](QUICKSTART.md).* 🚀
