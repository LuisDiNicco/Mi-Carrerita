# Mi Carrerita

Este repositorio contiene el código fuente de **Mi Carrerita**, una aplicación web diseñada para resolver el problema clásico de la gestión y planificación de asignaturas a lo largo de una carrera universitaria, utilizando visualización de grafos, algoritmos de rutas críticas e inferencia de recomendaciones horarias sin solapamientos.

## Propósito y Contexto del Proyecto

El proyecto nace de la necesidad de tener una herramienta centralizada que no solo lleve el trackeo del progreso académico (materias aprobadas, en curso, pendientes) sino que actúe como un planificador de cursada real. Con motores de recomendación inteligentes, permite al estudiante universitario anticipar cuellos de botella mediante el cálculo de la Ruta Crítica de su plan de estudios y evitar conflictos de horarios.

Las reglas de negocio propias del sistema universitario (como las franjas horarias de cursada, correlatividades restrictivas y evaluación de rendimiento) fueron modeladas y aisladas bajo una arquitectura orientada a servicios.

---

## Arquitectura y Stack Tecnológico

El sistema se divide en dos capas bien definidas que se comunican mediante una API RESTful, asegurada con JWT y estrategias OAuth 2.0.

### Frontend (SPA)
Se optó por una Single Page Application (SPA) para garantizar una experiencia de usuario fluida y persistente, especialmente crítica en la manipulación in-place del grafo interactivo de materias.

- **Framework Core:** React 18 + Vite (para optimización de compilación y HMR ultrarrápido).
- **Lenguaje:** TypeScript estricto, mitigando errores en tiempo de ejecución.
- **Gestión de Estado Centralizado:** `Zustand`. Se priorizó sobre Redux para reducir el boilerplate, aprovechando hooks reactivos ligeros sin sacrificar control de estado global (ej. sesión de usuario, carga asíncrona del grafo).
- **Core de Visualización:** `React Flow`. Maneja el layout algorítmico del grafo de materias en un canvas de alto rendimiento.
- **Estilado:** Tailwind CSS, logrando un diseño atómico y un theme _retro_ altamente consistente sin la sobrecarga de preprocesadores pesados.

### Backend (API Gateway)
El servidor funciona como el cerebro del cálculo de grafos, persistencia transaccional y validación estricta de reglas de negocio.

- **Framework Core:** NestJS 11. Su inyección de dependencias (DI) y patrón modular garantizan una base de código desacoplada, fácilmente testeable y escalable a microservicios a futuro funcional.
- **Lenguaje:** TypeScript (sincronizado con los DTOs del frontend).
- **Persistencia y ORM:** Prisma ORM interactuando con SQLite (entorno de desarrollo local) y PostgreSQL (producción). Provee Type-Safety desde el esquema de la DB hasta el resolutor de la ruta HTTP.
- **Seguridad y Auth:** Passport.js para la integración con Google OAuth 2.0. La gestión de estado stateless utiliza JSON Web Tokens (JWT) asimétricos con rotación para invalidación de sesiones.
- **Event-Driven:** Uso interno de `EventEmitter2` para lógica desacoplada, particularmente vital en casos de uso de cómputo diferido como el cálculo asíncrono de Logros/Trofeos.

Para una inmersión técnica absoluta en la toma de decisiones, compensaciones (trade-offs) y diseño del sistema, referirse a la documentación técnica en `ARCHITECTURE.md`.

---

## Características Principales

1. **Motor de Renderizado de Grafo de Materias:** 
   Evalúa el árbol de dependencias (`Correlatividades`) de un plan de estudio en tiempo real, separándolo en hitos y calculando la "Ruta Crítica": el camino más largo de dependencias que define el tiempo mínimo de graduación.
2. **Planificador Interactivo Evita-Colisiones:**
   Permite volcar la oferta horaria real. Mediante un algoritmo de validación transversal, cruza los horarios propuestos para emitir una "Recomendación de Cursada", filtrando las materias disponibles donde exista solapamiento e ignorando franjas sin oferta (ej. 12hs-14hs y 18hs-19hs).
3. **Métricas Avanzadas (Dashboard):**
   Trackeo analítico del rendimiento histórico. Visualiza velocidad de avance, distribución de notas, y asignaturas cuello de botella.
4. **Sistema Desacoplado de Trofeos (Observer Pattern):**
   Motor de gamificación evaluado de manera lazy y asíncrona del lado del servidor para no bloquear el Event Loop de Node.js durante la mutación de estado de las cursadas.

---

## Ejecución en Entorno de Desarrollo Local

### Prerrequisitos
- Node.js (v18+)
- Gestor de paquetes `npm` o `pnpm`.
- Instancia local o credenciales de cloud para bases de datos (SQLite default) y Google OAuth.

### Levantamiento
1. Instalar variables de entorno a partir de los templates `.env.example` en `./server` y `./client`.
2. Instalar las dependencias de los monorepos:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Correr las migraciones y seeders de Prisma (Genera datos iniciales como la lista de materias y sus correlatividades):
   ```bash
   cd ../server
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Levantar instancias en parelelo:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run start:dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

## Entorno de Pruebas (Testing Suite)

La aplicación cuenta con una amplia cobertura de pruebas (Superando métricas > 75%), utilizando un enfoque tanto unitario como asíncrono (E2E).
Para ejecutar la Suite en su totalidad:

### Frontend (Vitest & Testing Library)
Abarca renderizado de portales modales, interacciones the doble-click al grafo virtual y consistencia the Stores.
```bash
cd client
npm run test:cov
```

### Backend (Jest Suite)
Abarca pruebas a algoritmos the rutas críticas, colisión de horarios N+1, y E2E the la REST API.
```bash
cd server
npm run test
```

---

## Documentación Adjunta
- `ARCHITECTURE.md`: Deep-dive sobre las decisiones arquitectónicas, tradeoffs de renderizado/estado y diseño relacional.
- `BUSINESS_RULES.md`: Dominio lógico y casos de uso estructurados propios del ámbito universitario aplicados al código.

---
*Desarrollado y mantenido focalizando la ingeniería de software aplicada, código robusto y principios SOLID.*
