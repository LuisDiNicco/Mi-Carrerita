# Backend updates - 2026-02-18

Este README resume lo nuevo del backend y lo que falta en el front para verlo en la app.

## Resumen rapido
- Se agregaron modulos y endpoints para dashboard, horarios, recomendaciones, historial academico y trofeos.
- Se agrego un modo de desarrollo que auto resetea y seed la base cuando inicia el servidor.
- Se mejoro performance y tipado en consultas clave (menos N+1, mas selects especificos).

## Endpoints nuevos o actualizados

### Academic Career
- GET /academic-career/graph
  - Devuelve el grafo completo de materias para el usuario.
- PATCH /academic-career/subjects/:subjectId
  - Actualiza estado, nota, dificultad, notas, fecha.

### Dashboard
- GET /dashboard
  - Devuelve todos los graficos y resumen de rendimiento.

### Schedule (horarios)
- POST /schedule/timetable
  - Crea un horario para una materia.
- POST /schedule/timetable/batch
  - Crea varios horarios a la vez.
- GET /schedule/timetable
  - Lista horarios del usuario.
- DELETE /schedule/timetable/:subjectId
  - Elimina todos los horarios de una materia.
- GET /schedule/conflicts
  - Devuelve conflictos detectados.

### Recommendations (recomendaciones)
- GET /schedule/recommendations
  - Devuelve recomendaciones actuales y conflictos.
- POST /schedule/recommendations/generate
  - Recalcula recomendaciones.
- PATCH /schedule/recommendations/:subjectId
  - Cambia estado (SUGGESTED -> MANTENIDA -> DELETED).

### Academic History (historial)
- GET /history
  - Paginado y filtros (status, fechas, nota, planCode, year, isIntermediate).
- PATCH /history/:recordId
  - Edita un registro.
- DELETE /history/:recordId
  - Borra un registro.
- DELETE /history
  - Borra todo el historial del usuario.

### Trophies (trofeos)
- GET /trophies
  - Devuelve la vitrina completa con progreso.
- GET /trophies/:code
  - Devuelve un trofeo especifico.
- POST /trophies/check
  - Evalua y desbloquea trofeos elegibles.

## Reglas importantes del dominio
- SubjectStatus es string enum: PENDIENTE, DISPONIBLE, EN_CURSO, REGULARIZADA, APROBADA.
- Timetable usa period como string: AM, PM, EVENING.
- AcademicRecord.isIntermediate indica grado intermedio.
- Trofeos usan reglas basadas en:
  - aprobadas/regularizadas
  - promedios
  - horas completadas
  - semestre/anio
  - dificultad
  - notas con texto para reintentos (ver abajo)

## Trofeos (detalle de logica)
- Todas las reglas ya estan implementadas.
- Para reintentos, se usa el campo notes con patrones tipo:
  - "intento 2", "intento 3"
  - "reintento", "recursada", "retry"
- Si queres algo 100% preciso, lo ideal es agregar un campo attempts en AcademicRecord.

## Modo desarrollo (dev)
- EnvironmentAuthGuard usa DevAuthGuard en dev y JWT en prod.
- DevAuthGuard crea/inyecta un usuario por defecto (email de APP_DEFAULTS).
- En dev se aplica automaticamente:
  - prisma migrate reset --force --skip-generate
  - prisma db seed
- Se controla con:
  - AUTO_DB_RESET=true (default)
  - AUTO_DB_RESET=false (solo deploy + seed)

## Que falta en el front

### Integracion API
- Implementar llamadas a todos los endpoints listados arriba.
- Agregar manejo de errores y estados loading para cada pagina.
- Usar authFetch con cookies/JWT segun tu setup actual.

### Vistas y componentes
- Academic Career:
  - Grafo de materias con estados, notas y correlativas.
  - Edicion de estado/nota/dificultad/fecha/notas.
- Dashboard:
  - Graficos (performance, eficacia, carga, volumen, dispersion, burn-up, ranking).
  - Resumen general.
- Schedule:
  - Alta y baja de horarios por materia.
  - Vista de conflictos detectados.
- Recommendations:
  - Lista de sugeridas y mantenidas.
  - Boton para generar recomendaciones.
  - Accion para cambiar estado.
- Academic History:
  - Tabla paginada con filtros.
  - Edicion inline o modal.
  - Accion para borrar uno o todo.
- Trophies:
  - Vitrina por tier con progreso.
  - Detalle de trofeo y fecha de desbloqueo.
  - Boton "check" para recalcular.

### Mapeo de datos
- Recordar que statusDate se envia como string ISO (yyyy-mm-dd).
- Timetable y conflictos usan period como string (AM/PM/EVENING).
- Trophies incluyen progress (0-100) y unlockedAt opcional.

## Notas finales
- Swagger disponible en /api/docs.
- Si el front ve 404/500, revisar que el dev reset haya corrido (logs en consola).
