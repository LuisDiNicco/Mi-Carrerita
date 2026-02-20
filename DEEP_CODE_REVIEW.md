# Deep Code Review & Plan de Mejora - Mi Carrerita

## 1. Arquitectura y Estructura de Archivos
**Evaluación:** Excelente. Tanto el cliente (React) como el servidor (NestJS) siguen una arquitectura modular orientada a dominios (Feature-based). Esto favorece enormemente la mantenibilidad y la inyección de dependencias. 
- *Cliente*: Estructura `features/`, `shared/`, lo que previene dependencias desordenadas.
- *Servidor*: Módulos `academic-career`, `schedule`, `trophy`, lo que permite un claro aislamiento de contextos.

## 2. Decisiones de Diseño y Patrones
**Evaluación:** Muy buenas decisiones. 
- *Gamificación:* El uso de un patrón Event-Driven (Publisher/Subscriber con `EventEmitter2`) para los trofeos es crucial para no bloquear el Event Loop.
- *Gestión de Estado:* `Zustand` en el frontend es acertado para aplicaciones con manipulaciones frecuentes de un lienzo complejo como `ReactFlow`, evitando renders innecesarios.

## 3. Eficiencia y Uso de Recursos (Puntos a Mejorar)
**Hallazgos:**
1. **Problema N+1 en Base de Datos (`ScheduleService`):**
   - En el método `setMultipleTimetables` (servidor), se realiza un bucle `for...of` donde en cada iteración se ejecutan múltiples sentencias `await tx.subject.findUnique` y `await tx.timetable.findMany`. Si un estudiante intenta subir muchas materias a su calendario, la latencia de la base de datos se dispara.
   - *Solución:* Recuperar todos los `subjects` y `timetables` del usuario con un único `findMany` antes de comenzar las validaciones, operar en memoria para chequear conflictos, y hacer un `createMany` o iterar solo los `upsert`.

2. **Acoplamiento de Lógica en React (`CareerGraph.tsx` y Hooks):**
   - El hook `useCareerGraph` exporta una cantidad masiva de variables y setters (`searchQuery`, `setSearchQuery`, `showMinimap`, etc). Esto delega lógica de UI básica al hook de negocio. 
   - *Solución:* Separar el estado de la Vista (MiniMap, Pantalla Completa, Búsqueda) del estado del Dominio (Nodos, Aristas, Carga). Reducir los re-renders.

## 4. Legibilidad y Mejores Prácticas
**Evaluación:** Código tipado correctamente, uso de interfaces para DTOs y validaciones con `class-validator` en backend. Interfaz limpia usando Tailwind y variables CSS (`index.css`).

## 5. Testing
**Hallazgos:** Falta de robustez en test automatizados. Se necesita una suite sólida E2E (frontend) y Unit test cubriendo los algoritmos vitales del backend (como `schedule.helpers.ts` y la ruta crítica).

---

# Plan de Mejora

### Fase 1: Refactorización y Eficiencia
- **Backend:** Refactorizar `ScheduleService.setMultipleTimetables` para pre-cargar datos y eliminar la consulta N+1. 
- **Frontend:** Limpieza y separación de responsabilidades en `CareerGraph.tsx` y su hook correspondiente.

### Fase 2: Robustez de Testing (Roadmap)
- **Backend Unitary Tests:** 
  - Validaciones de algoritmos de dependencias y cálculo de estados (`academic-career.service`).
  - Helper de colisión horaria (`schedule.helpers.ts`).
- **Backend E2E:**
  - Fluxo completo: Autorización -> Carga de materias -> Obtener Grafo -> Intentar solapamiento de horarios (fallo esperado).
- **Frontend Unitary & Component Tests:**
  - Tests para los stores de Zustand (`academic-store.ts`).
  - Tests para renderizado de nodos y mapeo de estados.
- **Frontend E2E:** 
  - Simular el flujo del usuario usando el mapa, buscando una materia y cambiando su estado a "Aprobada" y evaluando si la correlativa se desbloquea.

### Fase 3: Documentación
- Actualizar `ARCHITECTURE.md` para reflejar con mayor profundidad técnica cómo operan las rutinas de resolución N+1 optimizadas y la capa de testing añadida.

---

*(Al finalizar las tareas, se añadirá aquí abajo una Code Review final comprobando la resolución de estos puntos)*
