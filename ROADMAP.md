# 🗺️ Product Roadmap - Mi Carrerita

## Visión
Convertir Mi Carrerita en la plataforma número uno para estudiantes de carreras tecnológicas para planificar y optimizar su trayectoria académica mediante visualización interactiva, recomendaciones inteligentes y gamificación.

---

## 📊 Versión Actual: 1.0.0

**Estado:** MVP Lanzado ✅

### Completado ✅
- [x] Autenticación OAuth con Google
- [x] JWT + Refresh tokens
- [x] Visualización interactiva de grafo de carrera (React Flow)
- [x] Historial académico
- [x] Sistema de recomendaciones (3 planes: A, B, C)
- [x] Dashboard con estadísticas
- [x] Sistema de logros (trophies)
- [x] Design system retro
- [x] Documentación completa
- [x] Setup automático

---

## 🎯 Versión 1.1.0 - "Colect & Personalize"

**ETA:** Q2 2024

### Features
- [ ] **Colecciones de Carreras Universitarias**
  - Agregar múltiples carreras del catálogo
  - Cambios rápidos entre carreras
  - Guardar progreso en cada carrera

- [ ] **Personalización de Colores**
  - Editor visual de temas
  - Guardar temas personalizados
  - Themes predefinidos (dark mode avanzado)

- [ ] **Exportar / Importar Datos**
  - Exportar a PDF (carrera + estadísticas)
  - Exportar a JSON (backup)
  - Importar desde JSON

- [ ] **Notificaciones**
  - Recordatorios de correlatividades cumplidas
  - Alertas de asignaturas bloqueadas
  - Email notifications (opcional)

### Technical
- [ ] Implementar Service Worker (offline support)
- [ ] Agregar endpoints de export (PDF, JSON)
- [ ] Mejorar performance (lazy loading)
- [ ] Código splitting más agresivo

---

## 🔥 Versión 1.2.0 - "Social & Collaboration"

**ETA:** Q3 2024

### Features
- [ ] **Grupos de Estudio**
  - Crear/unirse a grupos
  - Chat por grupo
  - Compartir recursos
  - Cronograma compartido

- [ ] **Compartir Carrera**
  - Link público de perfil
  - Mostrar progreso sin mostrar datos sensibles
  - Comparar carreras con amigos

- [ ] **Comentarios en Asignaturas**
  - Rating por parte de estudiantes
  - "Tips" para pasar la materia
  - Reviews anónimas

- [ ] **Ranking / Leaderboards**
  - Top estudiantes por completion rate
  - Estadísticas globales
  - Badges públicos

### Technical
- [ ] Implementar WebSockets (chat en tiempo real)
- [ ] Agregar module: chat
- [ ] Agregar module: social
- [ ] Implementar pagination en endpoints

---

## 🤖 Versión 1.3.0 - "AI Recommendations"

**ETA:** Q4 2024

### Features
- [ ] **AI-Powered Recommendations**
  - Integración con Claude/GPT API
  - Recomendaciones personalizadas por estilo de aprendizaje
  - Predicción de dificultad real vs datos históricos

- [ ] **Chatbot Asistente**
  - Responde preguntas sobre carreras
  - Sugiere resources (libros, videos, cursos)
  - Predice carga de trabajo

- [ ] **Analysis & Insights**
  - Análisis de patrón de aprobación
  - Predicción de GPA final
  - Recomendaciones por hora del día (cuándo estudiar)

### Technical
- [ ] Agregar API key management para modelos IA
- [ ] Implementar caching de respuestas IA
- [ ] Agregar module: ai-engine
- [ ] Rate limiting estricto para APIs de IA

---

## 📱 Versión 1.4.0 - "Mobile Optimized"

**ETA:** 2025 Q1

### Features
- [ ] **Aplicación Móvil Nativa**
  - React Native o Flutter
  - Sincronización automática
  - Offline mode completo
  - Notificaciones push

- [ ] **PWA Mejorada**
  - App shell caching
  - Device sensors (para QR scanning de materiales)
  - Home screen installation

### Technical
- [ ] Build React Native app
- [ ] Implementar sincronización bi-direccional
- [ ] Agregar Capacitor para native features
- [ ] Testing en dispositivos reales

---

## 🏢 Versión 2.0.0 - "Enterprise Edition"

**ETA:** 2025 Q2-Q3

### Features
- [ ] **Multi-University Support**
  - Admin dashboard para universidades
  - Gestión de planes de estudio
  - Reportes institucionales

- [ ] **API Pública**
  - Documentación OpenAPI completa
  - Rate limiting por tier
  - OAuth para apps de terceros

- [ ] **Single Sign-On (SSO)**
  - Azure AD integration
  - SAML support
  - LDAP integration

- [ ] **Advanced Analytics**
  - Dashboard para estudiantes
  - Dashboard para tutores
  - Dashboard para coordinadores

### Technical
- [ ] Multi-tenant database design
- [ ] API gateway (Kong/AWS)
- [ ] Advanced caching (Redis)
- [ ] Microservices architecture (si crece)

---

## 🔄 Backlog General

### Alta Prioridad
- [ ] Soporte para múltiples idiomas (i18n)
- [ ] Dark mode completo
- [ ] Performance optimizations (Lighthouse 95+)
- [ ] Better test coverage (80%+)
- [ ] E2E tests con Cypress/Playwright

### Media Prioridad
- [ ] Analytics integration (Posthog, Mixpanel)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] CDN for static assets (Cloudflare)
- [ ] Database replication & disaster recovery

### Baja Prioridad
- [ ] Gamificación avanzada (badges dinámicos)
- [ ] AR visualization de carrera
- [ ] Integración con bibliotecas virtuales
- [ ] Planificador de tiempo (Pomodoro integrado)

---

## 🐛 Bug Fixes & Improvements

### Conocidos
- [ ] React Flow: mejora zoom en móvil
- [ ] Loading spinner: oscuela mejor en temas oscuros
- [ ] Validación: mensaje de error más claro para JWT expirado
- [ ] Performance: reducir re-renders en CareerGraph

### Mejoras de código
- [ ] Refactorizar auth-store (es muy grande)
- [ ] Extraer lógica de graph en service reutilizable
- [ ] Mejorar tipos en Prisma (usar z.infer)
- [ ] Agregar constants para magic numbers

---

## 📈 Métricas de Éxito

### Usuarios
- 100 usuarios en Q1 2024 ✅
- 1,000 usuarios en Q3 2024
- 10,000 usuarios en 2025

### Technical
- Lighthouse Score: 95+
- Type coverage: 100%
- Test coverage: 80%+
- Performance: FCP < 1.5s, LCP < 2.5s

### Engagement
- Daily active users: 30%+
- Feature adoption: 70%+ usan recomendaciones
- Retention rate: 60%+ after 30 days

---

## 🚀 Deploy Milestones

| Version | Target | Status |
|---------|--------|--------|
| 1.0.0 | Q4 2023 | ✅ Completado |
| 1.1.0 | Q2 2024 | 📋 Planeado |
| 1.2.0 | Q3 2024 | 📋 Planeado |
| 1.3.0 | Q4 2024 | 📋 Planeado |
| 1.4.0 | Q1 2025 | 📋 Planeado |
| 2.0.0 | Q2 2025 | 📋 Planeado |

---

## 💡 Ideas Futuras (Nice to Have)

- [ ] Integración con Jira para seguimiento de proyectos
- [ ] Integración con GitHub (calcular horas de programación)
- [ ] VR campus tour (conocer la institución)
- [ ] Podcast/Video tutorials generados por IA
- [ ] Predicción de drop-out (retención estudiantil)
- [ ] Mentoría automática (matching con estudiantes avanzados)

---

## 🙏 Feedback

¿Ideas o sugerencias?
- [Crear una Discussion](https://github.com/usuario/Mi-Carrerita/discussions)
- [Reportar Bug](https://github.com/usuario/Mi-Carrerita/issues)
- [Feature Request](https://github.com/usuario/Mi-Carrerita/issues)

---

**Última actualización:** Enero 2024

**Mantén este documento actualizado a medida que progreses.** 🚀
