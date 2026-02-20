# 🏢 Reglas de Negocio (Business Rules)

Este documento centraliza todas las lógicas y reglas propias del bloque "negocio" universitario que `Mi Carrerita` mapea en código. Cualquier modificación en las reglamentaciones académicas debe reflejarse primero aquí y luego ser derivada al código fuente (Backend y Frontend).

---

## 1. Franjas Horarias (Shift System)

La facultad opera bajo un esquema bloqueado de tres turnos. No existe oferta académica válida fuera de estos rangos. El sistema ruteador y planificador de UI debe omitir o deshabilitar cualquier tiempo muerto.

### 1.1 Turnos Activos
- **Turno Mañana:** 08:00 a 12:00.
- **Turno Tarde:** 14:00 a 18:00.
- **Turno Noche:** 19:00 a 23:00.

### 1.2 "Zonas Muertas" (Breaks)
Las siguientes zonas horarias **NO deben mostrarse en el grid ni permitir asignaciones**, ya que en este lapso la facultad no imparte clases:
- **Mediodía:** 12:00 a 14:00.
- **Tarde/Noche:** 18:00 a 19:00.

---

## 2. Planificador y Motor de Recomendaciones (Scheduler Engine)

El armado de horarios de la facultad sigue reglas de colisiones matemáticas estrictas y dependencias de grafos.

### 2.1 Condiciones para "Materia Disponible"
Una materia cambia a estado `DISPONIBLE` únicamente si el estudiante alcanzó el "status final" de las predecesoras. Si una materia tiene 3 correlativas fuertes, las 3 deben figurar como `APROBADA` u `REGULARIZADA` según la exigencia del plan.

### 2.2 Carga de Oferta Horaria
- Para generar una recomendación factible o armar una ruta, el estudiante DEBE proporcionar los horarios propuestos para las materias que le interesan.
- **Sistema Anti-Colisión:** Nunca puede haber solapamiento (`overlap`) mayor a 0 minutos entre una asignatura pre-inscripta y otra. El sistema debe lanzar error 409 o un warning en Frontend.

### 2.3 Tipos de Recomendaciones
Para aportar valor al estudiante, la recomendación se divide en 2 motores:
- **Motor Real (Ideal Scheduler):** Toma lista de materias `DISPONIBLES` o `RECURSADAS`, compara su oferta de horarios asignada, descarta las combinaciones que chocan (solapan), e imprime un calendario armónico base.
- **Motor "Materias Clave":** Un análisis meramente de Grafo. Prioriza en un ranking las asignaturas pendientes basadas en su peso de la "Ruta crítica" (cuántas materias siguientes destraban). Esto ignora los horarios.

---

## 3. Rangos de Evaluación y Cursada

### Notas Aprobatorias y Referencias
- El rango de la nota final válida es un número entero/decimal acotado `[1, 10]`.
- Nota probatoria de Cursada: Mayor o igual a `4`. (La materia entra en `REGULARIZADA` o a veces `FINAL_PENDIENTE`).
- Promociones directas: Normalmente requieren notas `≥ 7` o `≥ 8` (dependiendo el estatuto reflejado en el calculador).

### 4. Sistema de Gamificación (Trofeos)

El motor de recompensas opera reaccionando al historial, validando bajo 4 Tiers: _Bronce, Plata, Oro, Platino._
- **Eficiencia (Recursera):** Recomienda evitar los estados recurrentes de `RECURSADA` para destrabar oros.
- **Velocidad (Tiempos):** Existen flags para "Año Limpio" o "Sprint" basados en años naturales de aprobación comparados a la inserción en la carrera.
- Cualquier lógica de validación de trofeo **NO debe comprometer la performance principal**. Si la métrica es compleja (promedios estacionales), se debe calcular en *background job* o asincrónicamente mediante *Events*.
