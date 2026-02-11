# 🎯 Choose Your Path - Mi Carrerita

Elige tu rol y encuentra la documentación que necesitas.

---

## 👨‍💻 Developer

### Objetivo: Entender y desarrollar el código

**Tiempo Total:** ~60 minutos

**Ruta Recomendada:**

1. **[QUICKSTART.md](QUICKSTART.md)** (5 min)
   - Setup e instalación básica
   - Primeros comandos

2. **[ARCHITECTURE.md](ARCHITECTURE.md)** (30 min)
   - Estructura de carpetas
   - Patrones de diseño
   - Flujo de datos

3. **[API.md](API.md)** (15 min)
   - Todos los endpoints
   - Ejemplos cURL
   - Respuestas esperadas

4. **[FAQ.md](FAQ.md)** (10 min)
   - Preguntas de desarrollo
   - Troubleshooting técnico
   - Tips de debugging

**Extras:**
- Abre [Swagger UI](http://localhost:3000/api/docs) para documentación interactiva
- Explora `client/src/features/` y `server/src/modules/`
- Lee comentarios en el código

---

## 🎨 Designer / UX

### Objetivo: Entender y mejorar el visual

**Tiempo Total:** ~30 minutos

**Ruta Recomendada:**

1. **[README.md](README.md)** (5 min)
   - Resumen ejecutivo

2. **[ARCHITECTURE.md](ARCHITECTURE.md#-diseño--ux)** (10 min)
   - Sección de Diseño
   - Design System Retro

3. **Explores UI Components** (15 min)
   - `client/src/shared/ui/` - Botones, cards, badges
   - `client/src/shared/styles/design-system-retro.ts` - Colores y tipografía
   - `client/src/shared/layout/` - Header y sidebar layouts

**Tareas Típicas:**
- Modificar colores: `design-system-retro.ts`
- Agregar componentes: crear en `client/src/shared/ui/`
- Mejorar animaciones: `styles/globals.css` o `@apply` en Tailwind

---

## 🔍 QA / Tester

### Objetivo: Verificar que todo funciona correctamente

**Tiempo Total:** ~45 minutos

**Ruta Recomendada:**

1. **[QUICKSTART.md](QUICKSTART.md)** (5 min)
   - Setup de ambiente

2. **[CHECKLIST.md](CHECKLIST.md)** (30 min)
   - Testing checklist completo
   - Manual testing steps
   - API testing

3. **[FAQ.md](FAQ.md)** (10 min)
   - Problemas conocidos
   - Cómo reportar bugs

**Herramientas:**
- [Swagger UI](http://localhost:3000/api/docs) - Probar APIs
- Browser Dev Tools - Inspeccionar network, console
- [Prisma Studio](http://localhost:5555) - Ver base de datos

---

## 🚀 DevOps / Infra

### Objetivo: Deploy y mantener en producción

**Tiempo Total:** ~40 minutos

**Ruta Recomendada:**

1. **[SETUP.md](SETUP.md#deployment)** (15 min)
   - Sección Deployment
   - Variables de entorno for prod

2. **[ARCHITECTURE.md](ARCHITECTURE.md#deployment-architecture)** (15 min)
   - Arquitectura de deployment
   - Escalabilidad

3. **[FAQ.md](FAQ.md)** (10 min)
   - Production checklist
   - Troubleshooting de deployment

**Configuración:**
- `docker-compose.yml` - Contenedores para producción
- `.env` - Variables sensibles (NEVER en git)
- `server/prisma/schema.prisma` - Cambios de BD

---

## 🤝 Contributor

### Objetivo: Contribuir al proyecto

**Tiempo Total:** ~50 minutos

**Ruta Recomendada:**

1. **[CONTRIBUTING.md](CONTRIBUTING.md)** (20 min)
   - Guía de contribución
   - Formato de commits
   - Estilo de código

2. **[ROADMAP.md](ROADMAP.md)** (20 min)
   - Features planeadas
   - Áreas donde ayudar
   - Prioridades

3. **[ARCHITECTURE.md](ARCHITECTURE.md)** (10 min)
   - Para entender dónde aportar

**Pasos:**
1. Fork el repo
2. Crea rama feature
3. Haz cambios siguiendo estilo
4. Abre Pull Request

---

## 📊 Project Manager / Product

### Objetivo: Ver el estado y dirección del proyecto

**Tiempo Total:** ~40 minutos

**Ruta Recomendada:**

1. **[README.md](README.md)** (10 min)
   - Visión general

2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** (15 min)
   - Qué se completó
   - Estadísticas
   - Estado actual

3. **[ROADMAP.md](ROADMAP.md)** (15 min)
   - Plan futuro
   - Versiones planeadas
   - Métricas de éxito

---

## 👨‍🎓 Student / Researcher

### Objetivo: Usar la app y entender la arquitectura

**Tiempo Total:** ~45 minutos

**Ruta Recomendada:**

1. **[README.md](README.md)** (5 min)
   - Qué es Mi Carrerita

2. **[QUICKSTART.md](QUICKSTART.md)** (5 min)
   - Empezar a usar

3. **[ARCHITECTURE.md](ARCHITECTURE.md)** (25 min)
   - Entender cómo funciona técnicamente
   - Stack tecnológico

4. **Usar la app** (10 min)
   - Visualizar tu carrera
   - Ver recomendaciones
   - Explorar features

---

## 🎯 First Time Here?

**Si es tu primera vez:**

1. Lee [README.md](README.md) completo (~5 min)
2. Sigue [QUICKSTART.md](QUICKSTART.md) (~5 min)
3. Luego elige tu rol arriba

**Total: 10 minutos para empezar**

---

## 🔑 Key Documents

| Documento | Para Quién | Leer Cuándo |
|-----------|-----------|-----------|
| [README.md](README.md) | Todos | Primero |
| [QUICKSTART.md](QUICKSTART.md) | Dev, QA, PM | Segundo |
| [SETUP.md](SETUP.md) | Dev, DevOps | Antes de empezar |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Dev, Designer, Student | Para entender |
| [API.md](API.md) | Dev, QA | Para usar APIs |
| [FAQ.md](FAQ.md) | Todos | Cuando hay problemas |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor | Antes de PR |
| [ROADMAP.md](ROADMAP.md) | PM, Contributor | Para context futuro |
| [CHECKLIST.md](CHECKLIST.md) | QA, PM | Pre-launch |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Todos | Para ver completitud |

---

## 🚨 Emergency Guide

**"El servidor no arranca"**
→ [FAQ.md - Error EADDRINUSE](FAQ.md#2-error-eaddrinuse-3000)

**"No tengo Google OAuth"**
→ [SETUP.md - Google OAuth Setup](SETUP.md#1-configuración-del-servidor)

**"Database está corrupta"**
→ [FAQ.md - Database](FAQ.md#10-base-de-datos-vacía-o-corrupta)

**"No entiendo la estructura"**
→ [ARCHITECTURE.md](ARCHITECTURE.md)

**"Quiero contribuir"**
→ [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📞 Need Help?

- **Documentation:** [INDEX.md](INDEX.md) - Mapa completo
- **Search:** Usa Ctrl+F para buscar en docs
- **Issues:** GitHub Issues para bugs reportados
- **Discussions:** GitHub Discussions para preguntas

---

## ⏱️ Reading Time Summary

| Path | Time | Best For |
|------|------|----------|
| Developer Complete | 60 min | Full dev setup |
| Designer Quick | 30 min | UI work |
| QA Focus | 45 min | Testing |
| DevOps Setup | 40 min | Production |
| Contributor Path | 50 min | PRs |
| Manager Summary | 40 min | Overview |
| Student Learning | 45 min | Understanding |

---

**Pick your path and start reading! 📚**

---

`Last updated: Enero 2024`
