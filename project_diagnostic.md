# Diagnóstico Completo del Proyecto Mi-Carrerita

---

## Sección 1: Incumplimientos Exhaustivos vs. `.agent`

Análisis punto por punto de cada archivo de reglas de `.agent` contra el código actual en `client/` y `server/`.

---

### 1.1 — Uso prohibido de `any` (Tipado Estricto)
**Fuentes:** [00-global.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/00-global.instructions.md), [backend.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/backend.instructions.md), [frontend.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/frontend.instructions.md), [02_typing_dtos_patterns.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/02_typing_dtos_patterns.md)
- **Archivos afectados:**
  - [server/src/shared/pdf-parser/pdf-parser.service.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/shared/pdf-parser/pdf-parser.service.ts)
  - [server/src/modules/trophy/services/trophy.service.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/trophy/services/trophy.service.ts)
  - [server/src/modules/auth/services/auth.service.spec.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/auth/services/auth.service.spec.ts)
  - [server/src/modules/trophy/services/trophy.service.spec.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/trophy/services/trophy.service.spec.ts)
  - `server/standalone.spec.ts`
  - [client/src/features/academic/components/CareerGraph.integration.test.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/academic/components/CareerGraph.integration.test.tsx)
  - [client/src/features/academic/components/HistoryTable.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/academic/components/HistoryTable.tsx)
  - [client/src/features/academic/components/useCareerGraph.test.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/academic/components/useCareerGraph.test.ts)
- **Complejidad:** Media. Requiere tipar payloads de `pdf2json` y responses de APIs externas. En tests, reemplazar por `jest.Mocked<T>` o `unknown`.
- **Solución:** Crear interfaces/types para cada payload dinámico. En tests, usar `as jest.Mocked<ServiceType>`.
- **¿Vale la pena?** **Sñ.** `any` desactiva la validación del compilador en lógica crñtica (parseo de PDFs, trofeos).

---

### 1.2 — `process.env` directo en código (Configuración Inyectada)
**Fuentes:** [05_config_security_conventions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/05_config_security_conventions.md), [security.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/security.instructions.md), [backend.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/backend.instructions.md)
- **Archivos afectados:**
  - [server/src/modules/auth/auth.module.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/auth/auth.module.ts)
  - [server/src/modules/auth/controllers/auth.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/auth/controllers/auth.controller.ts)
  - [server/src/modules/auth/strategies/google.strategy.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/auth/strategies/google.strategy.ts)
  - [server/src/main.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/main.ts) (en [ensureDevDatabase()](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/main.ts#15-54), justificable por ser bootstrap)
- **Complejidad:** Baja. Reemplazar por `ConfigService.get()` o `registerAs()` factory.
- **Solución:** Crear `auth.config.ts` con `registerAs('auth', () => ({...}))` e inyectar en los módulos/servicios.
- **¿Vale la pena?** **Sñ.** Mejora testabilidad, previene crashes por envs faltantes, y centraliza la configuración.

---

### 1.3 — Colores estáticos de Tailwind (Design Tokens Semánticos)
**Fuentes:** [08_tailwind_design_tokens.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/08_tailwind_design_tokens.md), [07_frontend_best_practices.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/07_frontend_best_practices.md)
- **Archivos afectados (extensivo):**
  - [client/src/features/trophies/TrophiesPanel.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/trophies/TrophiesPanel.tsx) — `bg-blue-500/10`, `bg-red-500/10`
  - [client/src/features/schedule/components/UnifiedSchedulePlanner.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/schedule/components/UnifiedSchedulePlanner.tsx) — `bg-blue-500/20`, `bg-blue-500`
  - [client/src/features/recommendations/RecommendationsPage.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/recommendations/RecommendationsPage.tsx) — `bg-blue-500/10`, `bg-red-500/10`, etc.
  - [client/src/features/dashboard/Dashboard.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/dashboard/Dashboard.tsx) — `bg-blue-500`
  - [client/src/features/academic/components/SubjectUpdatePanel.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/academic/components/SubjectUpdatePanel.tsx) — `bg-blue-500/10`, `bg-red-500/10`
  - [client/src/features/academic/components/HistoryTable.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/academic/components/HistoryTable.tsx) — `bg-blue-500/10`, `bg-red-500/10`, múltiples
  - [client/src/features/academic/components/SubjectNode.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/academic/components/SubjectNode.tsx) — `bg-red-500`
  - [client/src/features/academic/components/PdfPreviewModal.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/academic/components/PdfPreviewModal.tsx) — `bg-red-500/5`
  - [client/src/features/auth/components/AuthModal.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/features/auth/components/AuthModal.tsx) — `bg-red-500/10`
  - [client/src/shared/ui/RetroComponents.tsx](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/shared/ui/RetroComponents.tsx) — `bg-red-500`
- **Complejidad:** Media. Requiere definir variables CSS semánticas (`--destructive`, `--info`, `--success`) en [index.css](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/index.css) y referenciarlas con `var()`.
- **Solución:** Crear paleta semántica en CSS variables y crear clases utilitarias (`bg-destructive`, `bg-info`, `text-success`). Luego reemplazar globalmente.
- **¿Vale la pena?** **Sñ, a mediano plazo.** No es urgente, pero escala mucho mejor con temas (light/dark) y facilita un rediseño futuro sin tocar componentes.

---

### 1.4 — Negro Absoluto `#000000` en Dark Mode
**Fuentes:** [08_tailwind_design_tokens.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/08_tailwind_design_tokens.md), [07_frontend_best_practices.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/07_frontend_best_practices.md)
- **Archivos afectados:**
  - [client/src/index.css](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/index.css)
- **Complejidad:** Baja (inmediata). Cambiar a `#09090b` o equivalente.
- **Solución:** `Find & Replace` de `#000000` → `#09090b` y verificar visualmente.
- **¿Vale la pena?** **Sñ (imprescindible).** Cambio de 1 minuto con impacto real en confort visual.

---

### 1.5 — Ausencia de `@ApiTags` en Controllers (Swagger Parcial)
**Fuentes:** [03_api_errors_docs.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/03_api_errors_docs.md), [api-design.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/api-design.instructions.md)
- **Archivos afectados:** TODOS los controllers:
  - [academic-career.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/academic-career/controllers/academic-career.controller.ts), [academic-career-public.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/academic-career/controllers/academic-career-public.controller.ts)
  - [academic-history.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/academic-history/controllers/academic-history.controller.ts), [academic-history-public.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/academic-history/controllers/academic-history-public.controller.ts)
  - [auth.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/auth/controllers/auth.controller.ts)
  - [dashboard.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/dashboard/controllers/dashboard.controller.ts)
  - [schedule.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/schedule/controllers/schedule.controller.ts)
  - [trophy.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/trophy/controllers/trophy.controller.ts)
- **Nota positiva:** `@ApiOperation` y `@ApiProperty` SÍ están implementados en la mayorña de endpoints/DTOs. El `DocumentBuilder` y `SwaggerModule.setup` están correctos en [main.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/main.ts).
- **Complejidad:** Baja. Agregar 1 lñnea `@ApiTags('Nombre')` al inicio de cada controller.
- **Solución:** Agregar `@ApiTags('Academic Career')`, `@ApiTags('Auth')`, etc.
- **¿Vale la pena?** **Sñ.** Organiza automáticamente los endpoints en la UI de Swagger sin costo.

---

### 1.6 — God Services (Lñmite de Lñneas: Services < 200, Controllers < 80)
**Fuentes:** [backend.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/backend.instructions.md), [02_typing_dtos_patterns.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/02_typing_dtos_patterns.md)
- **Archivos afectados:**
  - [server/src/modules/trophy/services/trophy.service.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/trophy/services/trophy.service.ts) — **~736 lñneas** (3.7x el lñmite)
  - [server/src/modules/academic-history/services/academic-history.service.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/academic-history/services/academic-history.service.ts) — **> 200 lñneas**
  - [server/src/modules/academic-history/controllers/academic-history.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/academic-history/controllers/academic-history.controller.ts) — **149 lñneas** (1.9x el lñmite)
  - [server/src/modules/schedule/controllers/schedule.controller.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/schedule/controllers/schedule.controller.ts) — **~109 lñneas** (1.4x el lñmite)
- **Complejidad:** Alta. Requiere extraer validadores, estrategias de evaluación de trofeos, lógica de reglas de negocio a clases especializadas.
- **Solución:** Para [trophy.service.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/trophy/services/trophy.service.ts): patrón Strategy o Chain of Responsibility para evaluadores individuales de cada trofeo. Para controllers: extraer lógica de parseo de PDF a un servicio dedicado.
- **¿Vale la pena?** **Sñ, prioritario para [trophy.service.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/modules/trophy/services/trophy.service.ts).** Un archivo de 736 lñneas es un cuello de botella de mantenimiento. Los controllers de ~100-150 lñneas son aceptables si solo enrutan.

---

### 1.7 — Ausencia de Rate Limiting (`@nestjs/throttler`)
**Fuentes:** [05_config_security_conventions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/05_config_security_conventions.md), [security.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/security.instructions.md)
- **Archivos afectados:** [server/src/app.module.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/app.module.ts), endpoints de auth públicos.
- **Complejidad:** Baja. Instalar `@nestjs/throttler`, registrar `ThrottlerModule.forRoot()` y aplicar `@Throttle()` en endpoints de auth.
- **Solución:** `npm i @nestjs/throttler`, configurar en `AppModule`, proteger `/auth/login`, `/auth/register`.
- **¿Vale la pena?** **Sñ.** Protección básica anti-brute-force con ~15 min de implementación.

---

### 1.8 — Ausencia de Correlation IDs / Trazabilidad
**Fuentes:** [observability.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/observability.instructions.md), [04_observability_integrations.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/04_observability_integrations.md)
- **Archivos afectados:** Todo el backend (no existe mecanismo de `correlationId`).
- **Complejidad:** Media. Crear un middleware/interceptor que genere o propague `X-Correlation-Id`, lo inyecte en el contexto de ejecución y lo pase al logger.
- **Solución:** Crear `CorrelationIdMiddleware` + Global Interceptor de logging que registre `{method, path, statusCode, durationMs, correlationId}`.
- **¿Vale la pena?** **Depende.** Muy útil en producción con múltiples servicios; bajo valor inmediato en dev local de un monolito. Implementar cuando se acerque a producción.

---

### 1.9 — Ausencia de Health Checks (`/health`)
**Fuentes:** [observability.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/observability.instructions.md), [04_observability_integrations.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/04_observability_integrations.md)
- **Archivos afectados:** [server/src/app.module.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/app.module.ts) (ausente).
- **Complejidad:** Baja. `npm i @nestjs/terminus`, crear `HealthModule` con `HealthController`.
- **Solución:** Implementar endpoint `/health` con check de Prisma/DB.
- **¿Vale la pena?** **Sñ.** Necesario para Docker/K8s y útil como smoke test básico.

---

### 1.10 — Ausencia de Interceptor Global de Logging
**Fuentes:** [observability.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/observability.instructions.md), [04_observability_integrations.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/04_observability_integrations.md)
- **Archivos afectados:** Todo el backend. Solo existen interceptors de FileUpload (por `multer`), no hay un interceptor global que registre requests/responses.
- **Complejidad:** Baja. Crear `LoggingInterceptor` que registre método, URL, duración y status code.
- **Solución:** Crear e inyectar globalmente desde [main.ts](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/server/src/main.ts).
- **¿Vale la pena?** **Sñ.** Diagnóstico de performance y errores en producción se vuelve trivial.

---

### 1.11 — Ausencia de `toEntity()` / `fromEntity()` en DTOs
**Fuentes:** [02_typing_dtos_patterns.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/02_typing_dtos_patterns.md), [backend.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/backend.instructions.md)
- **Archivos afectados:** TODOS los módulos del backend. Ningún DTO implementa estos patrones de mapeo.
- **Complejidad:** Media/Alta. Requiere crear Response DTOs con factory `fromEntity()` y agregar `toEntity()` a los Request DTOs.
- **Solución:** Implementar en los DTOs crñticos (al menos `SubjectNodeDto`, `AcademicHistoryDto`, `TrophyDto`).
- **¿Vale la pena?** **Parcialmente.** Es boilerplate significativo para un proyecto pequeño. Recomiendo implementar solo donde el Prisma model difiere considerablemente del response shape.

---

### 1.12 — Ausencia de Errores de Dominio Custom
**Fuentes:** [backend.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/backend.instructions.md), [03_api_errors_docs.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/03_api_errors_docs.md)
- **Archivos afectados:** No existe carpeta `domain/errors/` en ningún módulo. Los errores se lanzan como `HttpException` directamente desde servicios.
- **Complejidad:** Media. Crear clases como `SubjectNotFoundError extends Error` y ajustar el `GlobalExceptionFilter` para mapearlas.
- **Solución:** Crear errores de dominio, mover los `throw new HttpException()` de los servicios a errores de dominio, y dejar que el filtro traduzca.
- **¿Vale la pena?** **Sñ.** Es el corazón de Clean Architecture. Los servicios no deberñan conocer HTTP status codes.

---

### 1.13 — Ausencia total de CSS Variables Semánticas
**Fuentes:** [08_tailwind_design_tokens.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/development_rules/08_tailwind_design_tokens.md)
- **Archivos afectados:** [client/src/index.css](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/client/src/index.css) — No se encontró uso de `var(--)` para colores. Los colores se aplican directamente con clases de Tailwind.
- **Complejidad:** Media. Definir la paleta completa en CSS variables y mapearla en `tailwind.config`.
- **Solución:** Implementar sistema semántico: `--background`, `--foreground`, `--primary`, `--muted`, etc. con variantes para dark mode.
- **¿Vale la pena?** **Sñ, pero planificarlo como un sprint completo de diseño.** Es un cambio sistémico que afecta todo el frontend.

---

### 1.14 — Sin Code Splitting (React.lazy / Suspense)
**Fuentes:** [frontend.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/frontend.instructions.md), [performance.instructions.md](file:///c:/Users/luisd/Desktop/Proyectos/Mi-Carrerita/.agent/instructions/performance.instructions.md)
- **Archivos afectados:** `client/src/app/` (router principal). No existe `React.lazy()` ni `<Suspense>` en ningún lugar.
- **Complejidad:** Baja/Media. Envolver las rutas principales en `React.lazy()`.
- **Solución:** `const Dashboard = React.lazy(() => import('../features/dashboard/Dashboard'))` + `<Suspense fallback={...}>`.
- **¿Vale la pena?** **Sñ.** Mejora LCP significativamente al cargar solo la ruta visible.

---

### 1.15 — Sin Skeleton Loaders (Spinners Genéricos)
**Fuentes:** `07_frontend_best_practices.md`, `frontend.instructions.md`
- **Archivos afectados:** Todo el frontend (no existe ningún componente `Skeleton`).
- **Complejidad:** Media. Crear componentes `Skeleton` reutilizables para cada vista.
- **Solución:** Implementar `<Skeleton />` genérico con variantes (line, card, avatar) y usarlos como `fallback` de Suspense.
- **¿Vale la pena?** **Sñ.** Mejora percepción de velocidad. Implementar progresivamente en las vistas más lentas.

---

### 1.16 — Sin `.env.example`
**Fuentes:** `security.instructions.md`
- **Archivos afectados:** Rañz del proyecto y `server/`.
- **Complejidad:** Baja (inmediata). Crear `.env.example` con las variables necesarias sin valores reales.
- **¿Vale la pena?** **Sñ.** Documentación mñnima obligatoria para cualquier onboarding.

---

### 1.17 — Sin Dockerfile
**Fuentes:** `06_devops_git_testing.md`
- **Archivos afectados:** Rañz del proyecto (no existe `Dockerfile`). Existe `docker-compose.yml` pero es solo para la DB.
- **Complejidad:** Media. Crear Dockerfiles multi-stage para `server/` y `client/`.
- **¿Vale la pena?** **Sñ, cuando se planifique el deploy.** No urgente para desarrollo local.

---

---

## Sección 2: Malas Prácticas Generales (Más Allá de .agent)

Problemas detectados independientemente de las reglas de `.agent`:

---

### 2.1 — `execSync` en `main.ts` para resetear la DB
- **Archivos:** `server/src/main.ts` (lñneas 15-52).
- **Problema:** `execSync('npx prisma migrate reset --force')` se ejecuta al inicio del servidor. Si alguna migración falla, el servidor crashea sin feedback claro. Además, si se olvida `AUTO_DB_RESET=false`, la DB se borra en cada reinicio.
- **Complejidad:** Media.
- **Solución:** Mover a un script npm separado (`npm run db:reset`). El servidor no deberña gestionar migraciones.
- **¿Vale la pena?** **Sñ (crñtico).** Es una bomba de tiempo para datos en staging/producción. El error que reportaste (`status: 255`) muy probablemente viene de aquñ.

---

### 2.2 — Catch vacño en seeding (`main.ts` lñnea 50)
- **Archivos:** `server/src/main.ts`
- **Problema:** `try { execSync('npx prisma db seed') } catch { }` — swallow silencioso de excepciones, exactamente lo que las reglas prohñben.
- **Complejidad:** Baja.
- **Solución:** Loguear el error aunque no sea fatal: `catch(e) { logger.warn('Seeding failed', e.message); }`
- **¿Vale la pena?** **Sñ.** Debugging invisible es la peor clase de deuda técnica.

---

### 2.3 — Módulos sin carpeta `domain/` (estructura plana)
- **Archivos:** Varios módulos backend no siguen la estructura hexagonal de `domain/` → `application/` → `infrastructure/`. Los servicios y controladores están mezclados directamente en la rañz del módulo.
- **Complejidad:** Alta en refactor completo.
- **Solución:** Reestructurar progresivamente. Empezar por los módulos más complejos (`trophy`, `academic-history`).
- **¿Vale la pena?** **Parcialmente.** Para un proyecto de esta escala, una estructura plana modular es aceptable. Solo se justifica la hexagonal completa en `trophy` (por complejidad) y `auth` (por seguridad).
- **⚠️ Contradicción con `.agent`:** Las reglas de `.agent/development_rules/01_architecture.md` exigen estrictamente la estructura hexagonal. Sin embargo, para un monolito con ~6 módulos simples, esta estructura es sobreingenierña (viola KISS/YAGNI también definido en `.agent`). **Recomendación:** Aplicar hexagonal solo en módulos con lógica de negocio compleja (trophy, auth); mantener estructura plana para CRUD simples.

---

### 2.4 — Componentes frontend gigantes
- **Archivos:**
  - `client/src/features/recommendations/RecommendationsPage.tsx`
  - `client/src/features/schedule/components/UnifiedSchedulePlanner.tsx`
  - `client/src/features/academic/components/HistoryTable.tsx`
- **Problema:** Componentes con probablemente más de 500 lñneas, mezclando lógica de estado, rendering y estilos.
- **Complejidad:** Media/Alta.
- **Solución:** Extraer hooks custom, sub-componentes y wrappers de layout.
- **¿Vale la pena?** **Sñ.** Componentes masivos son difñciles de testear y mantener.

---

### 2.5 — Sin manejo de errores en el frontend (Error Boundaries)
- **Archivos:** Todo el frontend.
- **Problema:** Si un componente React lanza una excepción en render, toda la app crashea sin recuperación.
- **Complejidad:** Baja. Crear `ErrorBoundary` wrapper.
- **Solución:** `class ErrorBoundary extends React.Component` o usar `react-error-boundary`.
- **¿Vale la pena?** **Sñ.** Protección básica de UX con 30 minutos de implementación.

---

---

## Sección 3: Preparación para Producción

Lista de todo lo necesario para desplegar en un entorno real, clasificado por criticidad.

---

### 🔴 Crñtico (Seguridad)

| # | Item | Estado | Acción |
|---|------|--------|--------|
| 1 | Rate Limiting (`@nestjs/throttler`) | ❌ Ausente | Instalar y proteger auth endpoints |
| 2 | `.env.example` con todas las variables | ❌ Ausente | Crear archivo con placeholders |
| 3 | `process.env` directo en módulo auth | ❌ Presente | Migrar a ConfigService inyectado |
| 4 | JWT Refresh Token con rotación | ⚠️ Verificar | Implementar si falta |
| 5 | Logs de intentos de auth fallidos | ⚠️ Verificar | Agregar logging en auth service |
| 6 | Stack traces ocultos al cliente en producción | ✅ `GlobalExceptionFilter` presente | Verificar que no exponga detalles |
| 7 | Secretos nunca en repositorio | ✅ `.env` en `.gitignore` | Mantener |

### 🟡 Importante (Infraestructura)

| # | Item | Estado | Acción |
|---|------|--------|--------|
| 8 | Dockerfile multi-stage (server) | ❌ Ausente | Crear con `USER node`, solo `dist/` en layer final |
| 9 | Dockerfile multi-stage (client) | ❌ Ausente | Crear con nginx para servir static |
| 10 | `docker-compose.yml` production-ready | ⚠️ Parcial (solo DB) | Agregar servicios backend y frontend |
| 11 | Health Check endpoint (`/health`) | ❌ Ausente | Implementar con `@nestjs/terminus` |
| 12 | CI/CD Pipeline (GitHub Actions) | ❌ Ausente | Crear workflow: lint → build → test → deploy |
| 13 | Logging estructurado (JSON) | ❌ Ausente | Configurar Pino o Winston con formato JSON |
| 14 | Correlation IDs | ❌ Ausente | Middleware de propagación |
| 15 | Métricas básicas (`/metrics`) | ❌ Ausente | Opcional pero recomendado con Prometheus |
| 16 | Eliminar `execSync` de `main.ts` | ❌ Presente | Mover a script separado |

### 🟢 Detalles (SEO / UX / Calidad)

| # | Item | Estado | Acción |
|---|------|--------|--------|
| 17 | Meta tags dinámicos (title, description) | ⚠️ Verificar | Implementar con `react-helmet-async` o Next.js Head |
| 18 | Web Vitals (LCP < 2.5s, CLS < 0.1) | ⚠️ Sin medir | React.lazy + Skeleton loaders mejorarñan esto |
| 19 | Favicon y Open Graph tags | ⚠️ Verificar | Agregar para compartir en redes sociales |
| 20 | `robots.txt` y `sitemap.xml` | ⚠️ Verificar | Crear si la app es pública |
| 21 | PWA Support (Service Worker) | ❌ Ausente | Opcional para app académica |
| 22 | `npm audit` en CI | ❌ Ausente | Agregar como step del pipeline |

---

---

## Sección 4: Análisis del Testing

### Estado Actual

**Backend (10 archivos de test):**
- `academic-career.service.spec.ts`
- `academic-history.service.spec.ts`
- `auth.service.spec.ts`
- `dashboard.service.spec.ts`
- `schedule.helpers.spec.ts`
- `recommendation.service.spec.ts`
- `schedule.service.spec.ts`
- `trophy.service.spec.ts`
- `pdf-parser.service.spec.ts`
- `standalone.spec.ts`

**Frontend (15 archivos de test):**
- Tests de componentes: `CareerGraph.integration.test.tsx`, `SubjectUpdatePanel.test.tsx`, `YearSeparatorNode.test.tsx`
- Tests de hooks: `useCareerGraph.test.ts`, `useGraphSearch.test.ts`
- Tests de utilidades: `year-separators.test.ts`, `year-utils.test.ts`, `graph.test.ts`, `utils.test.ts`
- Tests de store: `academic-store.test.ts`, `auth-store.test.ts`
- Tests de auth: `api.test.ts`, `auth.test.ts`
- Tests de UI: `RetroCalendar.test.tsx`, `RetroComponents.test.tsx`

---

### Falencias Crñticas

#### F1 — Tests basados en implementación, no en requisitos
**Problema:** Los tests se escribieron leyendo el código, no la especificación. Esto significa que si el código tiene un bug, el test NO lo detecta porque el test reproduce el mismo error.
**Evidencia:** Los tests usan `any` y mocks genéricos que no validan contratos reales.
**Impacto:** Falsa seguridad — los tests pasan con bugs presentes.

#### F2 — Sin tests de integración HTTP (Supertest)
**Problema:** No existe ningún test que haga un request HTTP real contra el servidor y valide el contrato completo (status code, body shape, headers).
**Impacto:** Los controladores nunca se testean como unidad de integración. Bugs en la serialización de DTOs, pipes de validación, y guards de auth son INVISIBLES.

#### F3 — Sin tests de arquitectura
**Problema:** No existe validación automatizada de que la capa `domain` no importa `@nestjs`. Actualmente se cumple, pero no hay nada que impida una violación futura.
**Herramienta recomendada:** `dependency-cruiser` con reglas configuradas para las capas del proyecto.

#### F4 — Sin smoke tests
**Problema:** No existe test que verifique si el servidor arranca correctamente. `standalone.spec.ts` existe pero su cobertura es mñnima.
**Impacto:** Errores de configuración (variables de entorno faltantes, módulos mal registrados) solo se detectan al ejecutar el servidor manualmente.

#### F5 — Sin tests E2E funcionales (solo configuración de Playwright)
**Problema:** No hay tests E2E que simulen flujos de usuario completos (login → subir PDF → ver dashboard).
**Impacto:** Los flujos cross-feature no se validan nunca automáticamente.

#### F6 — Aserciones débiles
**Problema:** Uso de aserciones vagas tipo `expect(result).toBeDefined()` o `expect(result).toBeTruthy()` que pasan aunque el resultado sea incorrecto.
**Impacto:** Inflación de cobertura sin verificación real de comportamiento.

#### F7 — Sin tests de regresión para bugs conocidos
**Problema:** Cuando se reporta un bug, no se agrega un test que lo reproduzca antes de corregirlo.
**Impacto:** Los bugs pueden reaparecer (regresión) sin que nadie lo note.

---

### Plan de Mejora del Testing

#### Filosofña: Testing Trophy (Kent C. Dodds)
```
        E2E (pocos, flujos crñticos)
       Integration (muchos, contratos HTTP)
      Unit (servicios de dominio, lógica pura)
     Static (TypeScript strict, ESLint, dependency-cruiser)
```

Priorizar integration tests sobre unit tests. Los unit tests solo para lógica de dominio compleja.

#### Metodologña recomendada
1. **Para cada bug reportado:** Escribir PRIMERO un test que reproduzca el bug (debe fallar), luego corregir.
2. **Para cada feature nueva:** Escribir tests desde los requisitos (`docs/`), NO desde la implementación.
3. **Test naming:** `describe('ServiceName') > it('should [resultado esperado] when [condición]')`.

#### Tipos de test a agregar

| Tipo | Prioridad | Qué cubrir | Herramienta |
|------|-----------|------------|-------------|
| **Smoke** | 🔴 Alta | App arranca, `/health` responde, auth responde | Jest + Supertest |
| **Integration HTTP** | 🔴 Alta | Cada endpoint: status code, body shape, validación | Supertest + TestingModule |
| **Unit (dominio)** | 🟡 Media | `trophy.service` reglas de evaluación, `pdf-parser` edge cases | Jest con mocks |
| **Arquitectura** | 🟡 Media | Reglas de dependencia entre capas | `dependency-cruiser` |
| **E2E Frontend** | 🟡 Media | Login → Upload PDF → Ver grafo → Ver dashboard | Playwright |
| **Componente** | 🟢 Baja | Componentes con lógica condicional compleja | Vitest + RTL |
| **Mutation Testing** | 🟢 Baja | Verificar que tests detectan cambios en lógica | Stryker.js |

#### Acciones Inmediatas (esta semana)
1. Crear test de smoke que levante el servidor y haga `GET /health` → `200`.
2. Crear test de integración para `POST /academic-history/parse-pdf` con un PDF de ejemplo → validar shape del response.
3. Agregar `dependency-cruiser` con regla `domain → NO framework imports`.
4. Reemplazar todos los `expect(x).toBeDefined()` solos por aserciones concretas sobre el valor esperado.

#### Métricas Target
- Cobertura de **comportamientos** (no lñneas) del 80% en servicios crñticos.
- 0 endpoints sin al menos 1 test de integración que valide `!= 500`.
- 100% de bugs corregidos acompañados de test de regresión.
