# Diseño y Arquitectura Técnica - Mi Carrerita

Este documento expone las justificaciones de arquitectura subyacente, analizando los compromisos (trade-offs), las decisiones de diseño adoptadas e insights fundamentales de cómo opera internamente Mi-Carrerita. Está orientado a líderes técnicos e ingenieros de software revisando la robustez y escalabilidad.

---

## 1. Arquitectura Topológica

El proyecto se despliega como un sistema Client-Server estándar, que favorece una clara separación de las responsabilidades de la UI interactiva (grafo, renders costosos de React) de la serialización, consistencia ACID y operaciones I/O pesadas en servidor.

### 1.1 Modelo y Patrón de Diseño General (Módulos vs. Monolito)

- **Backend (NestJS + Prisma):** Se utiliza una arquitectura interna **Modular / Features based**. A diferencia del MVC de la vieja escuela acoplado fuertemente por Capas, el dominio se sectoriza por características de negocio (ej. `academic-career`, `history`, `trophies`).
  - *Trade-off:* La inyección de dependencias modularizada eleva el grado de refactorización y la curva de aprendizaje inicial respecto a un archivo puro de Express, pero paga su costo al habilitar una separación del código extremadamente resiliente al refactor profundo (testing aislado).

- **Frontend (React SPA):** Aplicado el mismo patrón de directorios orientados a Domain Driven (`features/X`). Este feature-based structure encapsula hooks, componentes, y store en compartimientos estancos, minimizando las dependencias circulares que comúnmente degradan aplicaciones a gran escala.

---

## 2. Decisiones y Trade-offs Críticos de Frontend

### 2.1 State Management: Zustand vs. Redux Toolkit
Se implementó `Zustand` desechando el uso tradicional de Context API (propenso a renders masivos) o Redux.
- **Decisión:** Zustand maneja un state global pero expone variables como hooks autónomos, por tanto si el array de materias muta, solo el componente específico escuchándolo se actualiza, eludiendo el overhead del Virtual DOM.
- **Trade-off:** Se pierde la estricta trazabilidad de inmutabilidad nativa mediante middlewares rigurosos como Redux DevTools que grandes corporaciones estipulan, pero ganamos mucha velocidad de desarrollo en Features como la carga reactiva de Grafos pesados con menos boilerplate.

### 2.2 Motor de Grafos: `ReactFlow`
El núcleo del dominio visual es el Árbol de Materias. 
- **Decisión:** Al manejar árboles con posiciones X/Y (Dagre layouts) con nodos que mutan constantemente, se optó por delegar estas operaciones matriciales a `ReactFlow`. 
- **Problema de Rendimiento Manejado:** Un error temprano encontrado en la arquitectura fue el bucle subyacente de ReactFlow y React StrictMode provocando Memory Leaks por re-mediciones constates.  
  Se mitigó inyectando memoización estructural (`useMemo`) sobre las coordenadas iniciales ignorando la reactive feedback interna de bounds de los nodos de ReactFlow.

---

## 3. Decisiones y Trade-offs de Backend

### 3.1 ORM: Prisma vs Pattern Active-Record(TypeORM)
- **Decisión:** Prisma ORM es implementado por su Data Mapper concept e inferencia matemática automática de los tipos de TypeSCript.  El schema fuente unificado `.prisma` es la única "fuente de la verdad".
- **Trade-off:** Prisma maneja el *query engine* encapsulado un motor binario escrito en Rust por debajo, que tiene un tamaño de paquete final notable en arquitecturas Lambda (Serverless), resultando marginalmente en *Cold Starts* peores, pero para una Rest API en contenedor Node/Docker aporta un Developer Experience (DX) sobresaliente con cero riesgos de typo fields SQL.

### 3.2 Patrón Observer para la Gamificación (Trofeos)
Implementar `Trofeos` en un historial académico es computacionalmente costoso: evaluar promedios históricos, carreras rápidas o recursadas de materias exige queries masivas (JOIN y SUMs) a la DB.
- **Arquitectura Legacy:** Cálculo imperativo bloqueante (`Verificar Trofeos`) al guardar, pausaba la transacción de grabación de una materia de la API para devolver el DTO.
- **Arquitectura Moderna (Event-Driven):** 
  Se adopta un **Pattern Publisher/Subscriber** mediante `EventEmitter2`. 
  1. El controlador recibe y graba el update en el estado académico. 
  2. Emite el evento asíncrono `Subject.Updated`.
  3. Responde a la solicitud HTTP (Fast-Path).
  4. El `TrophyService` intercepta pasivamente, lee de la base los flags faltantes e invoca la mutación de los trofeos del user.
- **Trade-off:** Es de *Consistency Eventual*. Tras aprobar una materia particular, el trofeo se actualizaría luego de unos milisegundos tras la respuesta 200 de Node, por lo que el Frontend no obtendrá un payload de trofeos en esa misma response, derivando en tener que usar Polling / WebSocket si se quisiera alerta real-time.

---

## 4. Estricta Lógica de Planificación (Scheduler Motor)

El planificador opera como un DAG (Directed Acyclic Graph) solver simplificado. En la nueva refactorización se separaron los algoritmos pesados en dos facciones independientes para no asfixiar el hardware:
1. **Verificador Topological (Materias Clave):** Realiza un BFS transversal validado hasta hojas en grafos dependientes para inferir qué nodo superior destraba más ramas. Es asíncrono y memoizado si el layout curricular plan no muta.
2. **Motor Selector Anti-Colisión:** Algoritmo greedy O(N^2) limitado que verifica rangos binarios de solapamientos horarios sobre una porción muy pequeña N<30 (cant de materias ofertables recomendables). Se descartó linear programming complejos en favor de iteraciones directas debido a la naturaleza finita (max grid semanal) del espacio muestral en problemas universitarios.

## 5. Próximos Pasos Arquitectónicos y Escalabilidad
- **Múltiples Carreras Transversales:** Actualmente el diseño Data-Model está altamente acoplado a *un user con una carrera*. Cambiar esto impactaría el Schema relacional requiriendo un `EnrollmentModel`.
- **Caché Distribuido (Redis):** Si la consulta de los recorridos se estresa y el árbol general del plan 2023 es estático, el `plan graph` completo debería memoizarse en un cluster de Redis y no servirse mediante Prisma en cada F5 de la SPA, ahorrando ciclos puros de I/O contra la RDBMS de producción.
