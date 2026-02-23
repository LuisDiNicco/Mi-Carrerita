# SYSTEM INSTRUCTIONS: Backend Development Standards

**Context:** Node.js, TypeScript, NestJS backend projects.  
**Role:** Enforce Clean/Hexagonal Architecture, strict typing, and high-quality software engineering practices. Apply these rules to all code generation, refactoring, and code reviews.

---

## 1. ARCHITECTURE & DEPENDENCY RULES (CRITICAL)

* **Pattern:** Clean/Hexagonal Architecture. The goal is framework-agnostic business logic that is highly testable.
* **Layers:** `domain` (inner, core rules), `application` (middle, use cases), `infrastructure` (outer, I/O and frameworks).

### Strict Dependency Rules:
1.  **domain** MUST NOT depend on ANY other layer, framework, or library (except core TS). No NestJS decorators (`@Injectable`), no TypeORM decorators (`@Entity`), and no Axios imports.
2.  **application** depends ONLY on `domain`. It orchestrates business flows using domain entities.
3.  **infrastructure** depends on `application` and `domain`. This is where NestJS, TypeORM, and external SDKs live.
4.  **primary-adapters** (HTTP controllers, message consumers) MUST NOT depend on **secondary-adapters** (DB, external APIs). Orchestrate them strictly via application services.
5.  **Cross-layer communication** MUST use Interfaces defined in `application`. The infrastructure layer implements these interfaces (Dependency Inversion).

---

## 2. PROJECT STRUCTURE

Enforce this specific folder structure to maintain boundaries:

```text
src/
├── main.ts & AppModule.ts
├── domain/            # Pure business rules and models
│   ├── entities/      # Pure TS classes with business methods (e.g., `applyDiscount()`)
│   ├── enums/         # PascalCase names, SCREAMING_SNAKE_CASE values
│   └── errors/        # Custom error classes extending native Error
├── application/       # Orchestration and Port definitions
│   ├── interfaces/    # Repository/Service contracts (Prefix 'I', export const Token)
│   └── services/      # Use cases (Max 200 lines). One public method per use-case preferred.
└── infrastructure/    # Framework & External dependencies (Adapters)
    ├── base/          # Cross-cutting concerns: Config, logger, global filters, interceptors
    ├── primary-adapters/    # Input: Controllers, Guards, Webhooks, Consumers
    └── secondary-adapters/  # Output: DB, Redis, External APIs, Publishers
        ├── database/  # TypeORM entities, Repositories implementing app interfaces, UoW
        └── http/      # Axios/Fetch clients for external APIs, DTOs for external payloads
```

## 3. TYPING & DTOs

* **Strict TypeScript:** `any` is FORBIDDEN. It disables compiler checks. Use `unknown` if a payload is truly dynamic, and strictly type-guard it.
* **Enums Exhaustiveness:** When evaluating Enums in `switch` statements, ALWAYS cover all possible cases or provide a fail-safe default case throwing an error.
* **Request DTOs (Data Transfer Objects):**
    * Must use `class-validator` and `class-transformer` decorators to sanitize inputs at the edge.
    * Must implement a `toEntity(): DomainEntity` method to convert raw payloads into valid domain objects before passing them to the application layer.
* **Response DTOs:**
    * Must implement a static `fromEntity(entity: DomainEntity): ResponseDto` factory method to ensure internal domain structures are not leaked.
* **Domain Entities vs DB Entities:** NEVER leak DB entities (TypeORM) to application. Map them explicitly in `infrastructure/secondary-adapters/database/[name]/maps/`.

---

## 4. PATTERNS & IMPLEMENTATION DETAILS

* **Dependency Injection (DI):** Always use Constructor Injection. Inject interfaces using string constant Tokens (e.g., `@Inject(USER_REPO) repo: IUserRepository`).
* **Multipath Repository Pattern:** If a repository has multiple data sources (e.g., HTTP vs DB), use NestJS `useFactory` in the module to inject the correct concrete class based on environment variables.
* **Repositories:** Expose specific use-case methods with clear business meaning (e.g., `findActiveUsersByCountry`). Do NOT expose generic CRUD methods.
* **Unit of Work (UoW):** Use for multi-step DB transactions. Implement the UoW in infrastructure and expose an interface to application.
* **Database Entities:** Use a `BaseEntity` abstract class for common database columns across all tables (e.g., `createdAt`, `updatedAt`, `deletedAt`).
* **Database Migrations:** Database schema changes MUST be done via TypeORM Migrations. Do not use `synchronize: true` in production configs.
* **Controllers:** Keep under 80 lines. Parse HTTP context, execute DTO translation, delegate to Services, and return HTTP Status Codes.
* **Services:** Keep under 200 lines. Focus purely on business logic orchestration. Fail fast using early returns to prevent deep nesting.

---

## 5. API DESIGN & PAGINATION

* **RESTful Standards:** Use correct HTTP methods (GET, POST, PUT, PATCH, DELETE) and status codes (200, 201, 204, 400, 401, 403, 404, 409).
* **Collections & Pagination:** NEVER return unpaginated arrays for unbounded queries. Always implement standard pagination DTOs (`PaginatedRequest`: page, limit, sortBy) and return wrapped responses (`PaginatedResponse`: data, total, page, totalPages).

---

## 6. ERROR HANDLING

* Create custom domain errors in `domain/errors/` (e.g., `EntityNotFoundError`).
* **NEVER swallow exceptions** (e.g., empty catch blocks). Swallowing errors destroys stack traces.
* Use a **Global Exception Filter** (`infrastructure/primary-adapters/filters/`) to intercept Domain Errors and map them to HTTP Status Codes.

---

## 7. OBSERVABILITY, LOGGING & HEALTH

* **Interceptors:** Use NestJS Global Interceptors to log all incoming requests and outgoing responses (Method, URL, Duration, Status Code).
* **Context Logging:** Always log contextual identifiers (`userId`, `orderId`). NEVER log sensitive data (passwords, JWT tokens, PII).
* **Correlation IDs:** Pass a `traceId` or `correlationId` through the execution context to track requests across microservices.
* **Health Checks:** Always implement a `/health` endpoint (using `@nestjs/terminus`) exposing Liveness and Readiness probes, including DB and Redis connection statuses.

---

## 8. EXTERNAL APIS & CLIENTS

* Create dedicated HTTP clients in `secondary-adapters/http/` extending a `BaseHttpClient`.
* External payloads must be strictly typed and validated upon reception.
* Implement **Token Managers** with internal caching for OAuth/external auth to avoid requesting a new token on every outgoing call.
* Use **Circuit Breakers** and exponential backoff strategies for fault tolerance.

---

## 9. REDIS & CACHING

* Define cache interfaces in `application/interfaces/`. Implement logic in `infrastructure/secondary-adapters/redis/`.
* ALWAYS set a **TTL** (Time-To-Live). Infinite cache is forbidden.
* Use structured cache keys: `feature:entity:id`.
* **Handle Cache Stampede:** Use distributed locks (e.g., Redlock) for heavy, concurrent queries.

---

## 10. MESSAGING & EVENT-DRIVEN (KAFKA, RABBITMQ)

* **Publishers:** Are `secondary-adapters`. Define `IMessagePublisher` in `application`.
* **Consumers:** Are `primary-adapters`. They act like Controllers.
* **Idempotency is MANDATORY:** Guarantee that receiving the same message twice is safe (Inbox pattern).
* Validate incoming message payloads via strict schemas before processing.
* Implement **Dead Letter Queues (DLQ)** for failed messages. Catch terminal errors and route to DLQ instead of infinite retrying.

---

## 11. BACKGROUND JOBS & CRON

* Keep Job processors in `primary-adapters/jobs/`.
* Jobs must be completely **stateless**. Process in batches (e.g., chunk size 100) to avoid memory overflow.
* Jobs must log their lifecycle clearly: start time, total records, success/failure counts.

---

## 12. API DOCUMENTATION (SWAGGER)

* **Controllers:** Must be decorated with `@ApiTags()`. Endpoints require `@ApiOperation({ summary: '...' })` and accurate `@ApiResponse`.
* **DTOs:** Every property MUST be decorated with `@ApiProperty()`, detailing type, description, and examples.

---

## 13. CONFIGURATION & ENVIRONMENT

* **Strict Config:** NEVER read directly from `process.env` in the codebase.
* Use NestJS `@nestjs/config`. Register configurations using the Factory pattern (`registerAs`).
* Inject strictly typed configuration objects into your services via `@Inject(featureConfig.KEY)`.

---

## 14. SECURITY & VALIDATION

* Set up a global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` to prevent Mass Assignment.
* **CORS & Helmet:** Configure CORS securely using `app.enableCors()` with explicit origins. Use `helmet()` to set standard HTTP security headers.
* **Rate Limiting:** Implement `@nestjs/throttler` globally or per-controller for public endpoints to prevent abuse.
* **Authentication** via JWT (Guards). Role-based access via custom `@Roles()` decorators.
* **Secrets:** NEVER hardcode. Inject via `ConfigService`.
* **Prevent SQL Injection:** Strictly use ORM methods or parameterized Query Builders.

---

## 15. CODE CONVENTIONS & FORMATTING

* **Naming:** `camelCase` for variables and functions, `PascalCase` for classes and interfaces, `SCREAMING_SNAKE_CASE` for global constants.
* **Formatting:** Rely on Prettier and ESLint for code formatting. Do not invent custom spacing rules.
* **KISS / YAGNI:** Keep It Simple / You Aren't Gonna Need It. Do not implement over-engineered abstractions for features that don't exist yet.

---

## 16. INFRASTRUCTURE AS CODE (DOCKER)

If generating or modifying Dockerfile:
* Use **Multi-stage builds** (base, build, prod) to keep final images small.
* Ensure the final execution runs as a **non-root user** (e.g., `USER node`).
* Only copy `dist/`, `package.json`, and `node_modules` to the final layer.
* Never compile or copy `.env` files into the image.

---

## 17. GIT & VERSION CONTROL CONVENTIONS

Follow **Conventional Commits**:
* `feat:` (New feature)
* `fix:` (Bug fix)
* `refactor:` (Refactoring code without changing behavior)
* `chore:` (Config, tooling, dependencies)
* `test:` (Adding/fixing tests)
* Messages must be in the **imperative mood** (e.g., "feat: add user creation endpoint").

---

## 18. TESTING STANDARDS

* **Unit Tests** (`test/unit/`): Required for `application/services` and `domain/entities`. Use Mocks to isolate logic. Target >80% coverage.
* **Integration Tests** (`test/integration/`): Required for API endpoints (Supertest preferred).
* **Architecture Tests** (`test/architecture/`): Enforce Clean Architecture rules using tools like `tsarch`.

---

## 19. ANTI-PATTERNS TO AVOID

* **Controller containing business logic** or DB queries.
* **Circular dependencies** between services.
* **Boolean parameters** in methods: Use named options objects instead.
* **Mutable default parameters** (e.g., `date = new Date()`).
* **Redundant Comments:** Rely on expressive naming. Only explain "why", not "what".