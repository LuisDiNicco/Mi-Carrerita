# 🏢 Reglas de Negocio (Business Rules)

Centraliza todas las lógicas del dominio universitario de `Mi Carrerita`. Todo cambio en la reglamentación académica debe reflejarse aquí primero y luego derivarse al código.

---

## 1. Franjas Horarias (Shift System)

La facultad opera en tres turnos fijos. No existe oferta académica fuera de estos rangos.

| Turno   | Horario       |
|---------|---------------|
| Mañana  | 08:00–12:00   |
| Tarde   | 14:00–18:00   |
| Noche   | 19:00–23:00   |

**Zonas muertas** (sin clases): 12:00–14:00 y 18:00–19:00.

### Excepciones permitidas
- **Taller de Integración** (`3680`) puede cursarse en franjas no estándar (por ejemplo `12a14`).
- **Inglés** (`0901`–`0904`) y **Computación** (`0911`–`0912`) pueden tener:
   - menos de 4 horas semanales,
   - distribución en 2 días (ej: `MaVi12a14`),
   - modalidad **A distancia** sin ocupar celda física de grilla.
- En estos casos, el sistema debe permitir su representación aun cuando no coincida con los 3 turnos clásicos.

---

## 2. Planificador y Motor de Recomendaciones

### 2.1 Condiciones para "Materia Disponible"
Una materia pasa a `DISPONIBLE` solo si el estudiante cumplió el estado requerido en **todas** sus correlativas predecesoras (`APROBADA`, `EQUIVALENCIA` o `REGULARIZADA`, según exija el plan).

### 2.2 Oferta vs Cursada (separación obligatoria)
1. **Oferta de materias (facultad):** son todas las comisiones posibles que publica la universidad para materias disponibles del alumno.
   - Puede haber solapamientos entre materias.
   - Debe mostrarse completa, sin aplicar anti-colisión.
2. **Cursada elegida (alumno):** es la selección final del alumno a partir de la oferta.
   - Aquí sí aplica anti-colisión (no puede estar en dos aulas al mismo tiempo).
   - Solo una materia por celda/slot de cursada final.

### 2.3 Tipos de Recomendaciones
- **Motor Real (Ideal Scheduler):** Toma materias `DISPONIBLES` o `RECURSADAS`, descarta combinaciones que colisionan y genera un calendario base.
- **Motor "Materias Clave":** Análisis de grafo que rankea materias pendientes por peso en la ruta crítica (cuántas materias siguientes destraban). Ignora horarios.

---

## 3. Evaluación y Equivalencias

### 3.1 Notas
- Rango válido: entero/decimal en `[1, 10]`.
- Aprobación de cursada (→ `REGULARIZADA`): nota ≥ 4.
- Promoción directa: normalmente ≥ 7 (depende del estatuto).

### 3.2 Equivalencias
Las materias con origen `Equivalencia` en el PDF de Historia Académica son materias aprobadas por reconocimiento académico previo. Reglas:

1. **Origen en el PDF**: la columna `Origen` indica si la materia fue aprobada por `Promocion`, `Examen` o `Equivalencia`.
2. **Comportamiento para correlativas**: una `EQUIVALENCIA` se comporta exactamente igual que `APROBADA` — desbloquea todas las correlativas que dependan de ella.
3. **Con nota**: si la equivalencia tiene nota, se la trata exactamente como una materia aprobada en todos los cálculos (promedio, gráficos, etc.).
4. **Sin nota**: si la equivalencia no tiene nota, se la **excluye de todos los cálculos donde la nota sea relevante** (promedio, evolución del promedio, scatter de dificultad). Para contar materias completadas, horas o porcentaje de avance, se la incluye normalmente.  
   > Ejemplo: 62 materias aprobadas, 4 equivalencias sin nota → promedio = suma de notas / 58.
5. **Conteo de materias**: aprobadas + equivalencias cuentan como "materias completadas". La distinción es solo burocrática.

### 3.3 Materias Optativas
Solo impactan los totales del Dashboard (pendientes, en curso, etc.) si el alumno tiene un registro activo (`APROBADA`, `EQUIVALENCIA`, `REGULARIZADA`, `EN_CURSO`). De lo contrario no engrosan la currícula.

### 3.4 Equivalencia de Electivas concretas
Para la carrera, las electivas genéricas son `3672` (Electiva I), `3673` (Electiva II) y `3674` (Electiva III). Las materias concretas de oferta asociadas son:
- `3599` (Redes Móviles e IoT)
- `3677` (Lenguaje Orientado a Negocios)
- `3678` (Tecnologías en Seguridad)
- `3679` (Visión Artificial)

Regla funcional:
- Al aprobar/equivaler cualquiera de esas 4 materias, se completa una electiva genérica **en orden** (`3672` → `3673` → `3674`).
- Para recibirse se requieren 3 electivas completas; por eso el alumno cursa 3 de esas 4 concretas.

---

## 4. Cuatrimestres

El año lectivo tiene **3 cuatrimestres**:

| # | Nombre              | Período aproximado                    | Duración |
|---|---------------------|---------------------------------------|----------|
| 1 | 1er cuatrimestre    | Marzo–Julio                           | 16 sem.  |
| 2 | 2do cuatrimestre    | Agosto–Diciembre                      | 16 sem.  |
| 3 | Cuatrimestre verano | Enero–Febrero (puede iniciar en últimos días de enero y terminar a principios de marzo) | 5 sem.   |

**Clasificación por mes** (usado en gráficos):
- Q1 → meses 3–7 (Marzo a Julio)
- Q2 → meses 8–12 (Agosto a Diciembre)
- Q3 → meses 1–2 (Enero y Febrero)

**Formato de etiqueta en gráficos**: `[número]C[año]`  
Ejemplos: `1C2025` (1er cuatrimestre 2025), `3C2022` (verano 2022).

---

## 5. Gráficos del Dashboard

### 5.1 Burn Up (Progreso Acumulado)
- **Eje X**: muestra todos los cuatrimestres en los que el estudiante aprobó al menos una materia, usando el formato `1C/2C/3C + año`. No se proyectan cuatrimestres futuros.
- **Eje Y**: porcentaje de la carrera completado (materias aprobadas + equivalencias / total).
- Si entre dos cuatrimestres activos no hubo avances, ese período intermedio se omite del eje.

### 5.2 Evolución del Promedio
- **Eje X**: mismos cuatrimestres activos que el Burn Up.
- **Eje Y**: promedio acumulado hasta ese cuatrimestre, calculado **solo sobre materias con nota** (excluye equivalencias sin nota).
- El promedio es acumulativo (no por cuatrimestre aislado).

### 5.3 Proyección (Simulador)
- **Fórmula**: `⌈Materias restantes / Carga objetivo⌉ cuatrimestres`.
- La **carga objetivo** la define el usuario con el slider (materias por cuatrimestre).
- La proyección es **lineal** y no contempla correlatividades, oferta de horarios ni disponibilidad real.
- Se muestra adicionalmente el **ritmo histórico real** del estudiante (mat. aprobadas totales / cuatrimestres cursados) para que el usuario contraste su tendencia real con la hipotética.

---

## 6. Sistema de Gamificación (Trofeos)

El motor de recompensas valida bajo 4 Tiers: _Bronce, Plata, Oro, Platino_.
- **Eficiencia (Recursera):** Penaliza estados recurrentes de `RECURSADA`.
- **Velocidad (Tiempos):** Flags para "Año Limpio" o "Sprint" basados en años naturales de aprobación desde el ingreso.
- La validación de trofeos **no debe comprometer la performance principal**. Las métricas complejas se calculan en background mediante *Events* (`subject.status.updated`).
