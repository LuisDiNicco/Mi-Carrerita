# Copilot Instructions for Mi Carrerita

## Project map (read this first)
- This is a split app: `client/` (React + Vite + Zustand) and `server/` (NestJS + Prisma).
- Domain is academic planning: subject graph, correlativities, timetable conflicts, recommendations, dashboard metrics, and trophies.
- Backend is feature-modular (`server/src/modules/*`), not strict hexagonal despite `development_rules.md`.
- Shared parser logic lives in `server/src/shared/pdf-parser/` and is used by both `history` and `schedule` upload endpoints.

## Core runtime flow
- Frontend state starts in `client/src/app/App.tsx` and switches sections (`home`, `tree`, `dashboard`, `recommendations`, `history`, `trophies`).
- Auth + guest mode is central: `client/src/features/auth/store/auth-store.ts` controls whether data persists in DB or browser session.
- Academic graph state is in `client/src/features/academic/store/academic-store.ts`; availability recalculation mirrors backend status rules.
- Backend event flow: `AcademicHistoryService` emits `subject.status.updated`; `TrophyService` listens with `@OnEvent` and unlocks trophies asynchronously.

## Must-follow coding patterns in this repo
- Keep feature boundaries: add files under existing feature folders instead of creating cross-cutting mega utilities.
- Use `authFetch` for authenticated API calls (`client/src/features/auth/lib/api.ts`); it handles token refresh + retry on `401`.
- Preserve guest/auth dual path in UI APIs (see `fetchAcademicGraph` and `uploadHistoriaPdf` in `client/src/features/academic/lib/academic-api.ts`).
- For subject status updates, keep event emission (`subject.status.updated`) so trophies and dependent flows stay in sync.
- Prefer Prisma transactions for batched writes (`$transaction`) as done in history and schedule services.

## API and integration points
- History endpoints are under `/history` (including `/history/upload`, `/history/public-upload`, `/history/batch`).
- Schedule endpoints are under `/schedule` (`timetable`, `conflicts`, `recommendations`, `upload-oferta`).
- Swagger is enabled at `/api/docs` from `server/src/main.ts`.
- PDF ingestion accepts only `.pdf` and max 5MB via `ParseFilePipe` validators in controllers.

## Local development workflow
- Install per package: `cd server && npm install`, `cd ../client && npm install`.
- Backend dev: `cd server && npm run start:dev` (runs `setup-schema.js` + Prisma generate first).
- Frontend dev: `cd client && npm run dev`.
- Tests: `cd client && npm run test:cov`; `cd server && npm test`; e2e: `cd server && npm run test:e2e`.

## Database and environment caveats
- Development defaults to SQLite (`server/prisma/schema.prisma`); production swaps schema via `server/setup-schema.js` + `schema.production.prisma`.
- `server/src/main.ts` auto-resets and seeds DB in non-production unless `AUTO_DB_RESET=false`; avoid surprise data loss when debugging.
- Required backend env vars are validated in `server/src/app.module.ts` (`DATABASE_URL`, `CLIENT_URL`, JWT secrets, etc.).

## Business-rule constraints to preserve
- Respect university time windows and dead zones from `BUSINESS_RULES.md` (no classes 12:00–14:00 or 18:00–19:00).
- `EQUIVALENCIA` behaves as approved for unlock/progress, but grade-less equivalences are excluded from grade-based averages.
- Keep recommendation status lifecycle semantics (`SUGGESTED` → `MANTENIDA` → `DELETED`) consistent with existing DTOs/services.
