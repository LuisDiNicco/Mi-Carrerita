# Code Review - Backend P4 Implementation

**Fecha**: 18 Febrero 2026  
**Reviewer**: Copilot AI  
**Estado**: CRITICAL FINDINGS + RECOMMENDATIONS  
**Compilación**: ✅ TypeScript sin errores  
**Migraciones**: ✅ Sintaxis correcta (SQLite)

---

## 📋 Resumen Ejecutivo

✅ **Lo que está bien:**
- Arquitectura modular clara (4 módulos independientes)
- DTOs con validación completa
- Esquema Prisma bien definido
- Controllers con Swagger documentation
- Authorization guards en todos los endpoints
- Manejo de errores básico presente

❌ **Problemas críticos encontrados:** 5
⚠️ **Problemas de código quality:** 8  
💡 **Mejoras recomendadas:** 12

---

## 🚨 PROBLEMAS CRÍTICOS

### 1. **Type Safety Violations - `any` Type Usage** ⚠️ CRÍTICO

**Ubicaciones:**
- `schedule.service.ts` línea 59: `period: t.period as any`
- `schedule.service.ts` línea 153: `period: t.period as any`  
- `schedule.service.ts` línea 169: `private mapToTimetableDto(record: any)`
- `recommendation.service.ts` línea 72: `period: t.period as any`
- `dashboard.helpers.ts` líneas 10, 27, 55, etc: Parámetros `any[]`

**Impacto:** Viola la regla de "tipado fuerte" explícitamente requerida.

**Solución sugerida:**

Definir tipos genéricos para records desde BD:

```typescript
// schedule/types/schedule.types.ts
import { Timetable, Subject } from '@prisma/client';
import { TimePeriod } from '../../../common/constants/schedule-enums';

export type TimetableWithSubject = Timetable & {
  subject: Subject;
};

export type TimetableRecord = {
  id: string;
  userId: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    planCode: string;
  };
  period: TimePeriod | string; // Keep as string if enum not enforced in DB
  dayOfWeek: number;
  createdAt: Date;
};
```

Usar en servicios:

```typescript
// ANTES (malo)
private mapToTimetableDto(record: any): TimetableDto { ... }

// DESPUÉS (bien)
private mapToTimetableDto(record: TimetableWithSubject): TimetableDto {
  return {
    id: record.id,
    subjectId: record.subjectId,
    subjectName: record.subject.name,
    planCode: record.subject.planCode,
    period: record.period,
    dayOfWeek: record.dayOfWeek,
    dayLabel: DAY_LABELS[record.dayOfWeek] || `Day ${record.dayOfWeek}`,
  };
}
```

---

### 2. **Type Safety in Dashboard Helpers** ⚠️ CRÍTICO

**Archivo:** `dashboard/helpers/dashboard.helpers.ts`

**Problema:**
```typescript
// ANTES (malo)
export function groupBySemester(records: any[]): Map<string, any[]> {
  // ...
}

export function countByStatus(records: any[]): Map<string, number> {
  // ...
}
```

**Solución:**

Crear tipo reusable para AcademicRecord con Subject:

```typescript
// dashboard/types/dashboard.types.ts
export interface AcademicRecordWithSubject {
  id: string;
  userId: string;
  user?: unknown; // Omit if not used
  subjectId: string;
  subject: {
    id: string;
    planCode: string;
    name: string;
    year: number;
    hours: number;
    isOptional: boolean;
  };
  status: string;
  finalGrade: number | null;
  difficulty: number | null;
  statusDate: Date | null;
  notes: string | null;
  isIntermediate: boolean;
  updatedAt: Date;
}

// ENTONCES:
export function groupBySemester(
  records: AcademicRecordWithSubject[]
): Map<string, AcademicRecordWithSubject[]> {
  // ...
}
```

---

### 3. **Performance Issue - Sequential Batch Operation** ⚠️ SERIO

**Archivo:** `schedule/services/schedule.service.ts:112`

```typescript
// ANTES (secuencial, lento)
async setMultipleTimetables(
  userEmail: string,
  dtos: CreateTimetableDto[]
): Promise<TimetableDto[]> {
  const user = await this.prisma.user.findUnique({ ... });
  
  const results: TimetableDto[] = [];
  for (const dto of dtos) {  // <-- Loop secuencial
    const result = await this.setTimetable(userEmail, dto); // ⚠️ Recorre user + subject queries
    results.push(result);
  }
  return results;
}
```

**Problema:** Hace N queries al buscar subject para cada DTO (N+1 pattern)

**Solución:**

```typescript
async setMultipleTimetables(
  userEmail: string,
  dtos: CreateTimetableDto[]
): Promise<TimetableDto[]> {
  const user = await this.prisma.user.findUnique({
    where: { email: userEmail },
  });
  if (!user) throw new NotFoundException('Usuario no encontrado.');

  // Fetch all subjects at once
  const subjectIds = [...new Set(dtos.map(d => d.subjectId))];
  const subjects = await this.prisma.subject.findMany({
    where: { id: { in: subjectIds } },
  });
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  // Fetch all existing timetables once
  const existingTimetables = await this.prisma.timetable.findMany({
    where: { userId: user.id },
    include: { subject: true },
  });

  const results: TimetableDto[] = [];
  for (const dto of dtos) {
    const subject = subjectMap.get(dto.subjectId);
    if (!subject) throw new NotFoundException(`Materia ${dto.subjectId} no encontrada.`);
    
    // Reuse existing timetables instead of re-querying
    const conflicts = checkNewTimetableConflicts([...], { ... });
    if (conflicts.length > 0) {
      throw new BadRequestException(`Conflicto: ${conflicts...}`);
    }
    
    // Create in batch
    const record = await this.prisma.timetable.upsert({...});
    results.push(this.mapToTimetableDto(record));
  }
  
  return results;
}
```

**Mejora de performance:** De O(N) queries a O(1) queries

---

### 4. **Missing Input Validation in Some DTOs** ⚠️ SERIO

**Archivos afectados:**
- `trophy/dto/trophy.dto.ts` - Falta validar que rarity esté en rango 1-100
- `schedule/dto/schedule.dto.ts` - Falta validar dayOfWeek esté en rango 1-6

**Solución:**

```typescript
// trophy/dto/trophy.dto.ts
export class TrophyDefinitionDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  rarity: number;  // <-- Agregar validación

  @IsEnum(TrophyTier)
  tier: TrophyTier;
}

// schedule/dto/schedule.dto.ts
export class CreateTimetableDto {
  @IsString()
  subjectId: string;

  @IsEnum(TimePeriod)
  period: TimePeriod;

  @IsNumber()
  @Min(1)
  @Max(6)
  dayOfWeek: number;  // <-- Agregar validación
}
```

---

### 5. **Tournament Service Award Logic Too Simplistic** ⚠️ SERIO

**Archivo:** `trophy/services/trophy.service.ts:220-430`

**Problema:** 15+ criterios de trofeos tienen `TODO` y no están completamente implementados:

```typescript
// ANTES (incompleto)
case 'COMEBACK_PASS':
  // Need to track retries - IMPLEMENTAR
  return false; // TODO
  
case 'SPEED_RUNNER':
  // Need time-based calculation - IMPLEMENTAR
  return false; // TODO
```

**Criterios pendientes:**
1. COMEBACK_PASS - Necesita historial de intentos
2. SPEED_RUNNER - Necesita cálculo de tiempo < 2.5 años
3. FLAWLESS_EXECUTION - Necesita contar retries
4. CHALLENGE_ACCEPTED - Necesita ranking top 5 hardest
5. Y 10+ más...

**Solución:** Implementar helpers por criterio:

```typescript
// trophy/helpers/trophy-criteria.ts

export async function evaluateCombackPass(
  userId: string,
  prisma: PrismaService
): Promise<boolean> {
  const records = await prisma.academicRecord.findMany({
    where: { userId },
    include: { subject: true },
    orderBy: { statusDate: 'asc' },
  });

  let maxRetries = 0;
  const subjectAttempts = new Map<string, number>();

  for (const record of records) {
    const key = record.subjectId;
    const attempts = (subjectAttempts.get(key) || 0) + 1;
    subjectAttempts.set(key, attempts);
    maxRetries = Math.max(maxRetries, attempts);
  }

  return maxRetries >= 2; // Pass if retried at least once
}

export async function evaluateSpeedRunner(
  userId: string,
  prisma: PrismaService
): Promise<boolean> {
  const firstRecord = await prisma.academicRecord.findFirst({
    where: { userId, status: SubjectStatus.APROBADA },
    orderBy: { statusDate: 'asc' },
  });

  const lastRecord = await prisma.academicRecord.findFirst({
    where: { userId, status: SubjectStatus.APROBADA },
    orderBy: { statusDate: 'desc' },
  });

  if (!firstRecord || !lastRecord) return false;

  const yearsNeeded = (lastRecord.statusDate!.getTime() - firstRecord.statusDate!.getTime())
    / (1000 * 60 * 60 * 24 * 365);

  return yearsNeeded < 2.5; // Less than 2.5 years
}
```

---

## ⚠️ PROBLEMAS DE CÓDIGO QUALITY

### 6. **Long Method - Dashboard Service Builder** (Línea 103-195)

**Problema:** `buildDashboardSummary()` hace muchas cosas a la vez:

```typescript
private buildDashboardSummary(
  records: any[],
  semesters: SemesterDataPoint[]
): DashboardSummaryDto {
  // Calcula 7 métricas diferentes
  const totalSubjects = ... 
  const completedSubjects = ...
  const completionPercentage = ...
  // ... 4 más
  const currentStreak = ... // cálculo complejo
}
```

**Solución:** Extraer en métodos privados:

```typescript
private buildDashboardSummary(
  records: AcademicRecordWithSubject[],
  semesters: SemesterDataPoint[]
): DashboardSummaryDto {
  return {
    totalSubjects: records.length,
    completedSubjects: this.countCompletedSubjects(records),
    completionPercentage: this.calculateCompletionPercentage(records),
    totalHours: calculateTotalHours(records),
    completedHours: calculateCompletedHours(records),
    overallAverageGrade: this.calculateOverallAverage(records),
    overallSuccessRate: this.calculateSuccessRate(records),
    currentStreak: this.calculateGradeStreak(semesters),
  };
}

private countCompletedSubjects(records: AcademicRecordWithSubject[]): number {
  return records.filter(r => isSubjectPassed(r.status)).length;
}

private calculateGradeStreak(semesters: SemesterDataPoint[]): number | undefined {
  let streak = 0;
  for (let i = semesters.length - 1; i >= 0; i--) {
    if (semesters[i].avgGrade !== null && semesters[i].avgGrade >= 80) {
      streak++;
    } else {
      break;
    }
  }
  return streak > 0 ? streak : undefined;
}
```

---

### 7. **Too Many Chart Builders - Violates DRY** (Línea 87-161)

**Problema:** 7 chart builders hacen esencialmente lo mismo:

```typescript
private buildPerformanceChart(dataPoints: SemesterDataPoint[]): PerformanceChartDto {
  return {
    data: dataPoints.map((dp) => ({ ...dp })),  // ¿Solo propaga datos?
  };
}

private buildEfficacyChart(dataPoints: SemesterDataPoint[]): EfficacyChartDto {
  return {
    data: dataPoints.map((dp) => ({ ...dp })),  // ¿Idéntico?
  };
}

private buildAcademicLoadChart(dataPoints: SemesterDataPoint[]): AcademicLoadChartDto {
  return {
    data: dataPoints.map((dp) => ({ ...dp })),  // ¿Qué hace cada uno?
  };
}
```

**Pregunta:**
- ¿Cada gráfico necesita transformación diferente de los datos?
- ¿O simplemente propagan `SemesterDataPoint[]`?

**Si simplemente propagan:**

```typescript
// Refactor a factory pattern
private buildChart<T extends BaseChartDto>(
  data: SemesterDataPoint[]
): T {
  return { data } as T;
}

// O incluso simplificar en DTO:
async getDashboardData(userEmail: string): Promise<DashboardDataDto> {
  // ...
  const charts = {
    performanceChart: { data: semesterDataPoints },
    efficacyChart: { data: semesterDataPoints },
    academicLoadChart: { data: semesterDataPoints },
    // ... etc
  };
}
```

---

### 8. **No SQL Injection Prevention in Dynamic Queries** (Academic History Module)

**Archivo:** `academic-history/helpers/history.helpers.ts`

**Problema:** Si hay queries dinámicas SQL crudo, falta sanitization:

```typescript
// Asegurar que todos usen Prisma where clauses (ya se hace)
// ✅ BIEN: Using Prisma where objects (safe)
// ❌ MALO: Interpolating strings into queries (doesn't exist in code)
```

**Current state:** ✅ Está bien, usa Prisma safely.

---

### 9. **Missing Logging in Critical Operations** ⚠️ MEDIO

**Archivo:** Todos los services

**Problema:**
```typescript
// ANTES (sin logs)
async checkAndUnlockTrophies(userEmail: string): Promise<TrophyDto[]> {
  // ... no sé qué pasó si falla
}
```

**Solución:**

```typescript
async checkAndUnlockTrophies(userEmail: string): Promise<TrophyDto[]> {
  this.logger.debug(`[Trophy] Checking trophies for user: ${userEmail}`);
  
  try {
    const user = await this.prisma.user.findUnique({...});
    if (!user) {
      this.logger.warn(`[Trophy] User not found: ${userEmail}`);
      throw new NotFoundException('Usuario no encontrado.');
    }

    const newlyUnlocked: TrophyDto[] = [];
    
    for (const definition of TROPHY_DEFINITIONS) {
      try {
        const isUnlocked = await this.evaluateTrophyCriteria(definition.code, user.id);
        
        if (isUnlocked) {
          this.logger.log(`[Trophy] Unlocked: ${definition.name} for user ${user.id}`);
          newlyUnlocked.push(...);
        }
      } catch (err) {
        this.logger.error(
          `[Trophy] Failed to evaluate ${definition.code}: ${err.message}`
        );
        // Continue evaluating other trophies
      }
    }

    return newlyUnlocked;
  } catch (err) {
    this.logger.error(`[Trophy] checkAndUnlockTrophies failed: ${err.message}`);
    throw err;
  }
}
```

---

### 10. **No Unit Tests** ⚠️ IMPORTANTE

**Problema:** Ninguno de los services tiene tests.

**Solución (para próxima iteración):**

```typescript
// trophy.service.spec.ts
describe('TrophyService', () => {
  let service: TrophyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TrophyService,
        {
          provide: PrismaService,
          useValue: {
            trophy: { count: jest.fn() },
            user: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(TrophyService);
    prisma = module.get(PrismaService);
  });

  describe('seedTrophies', () => {
    it('should not seed if trophies already exist', async () => {
      (prisma.trophy.count as jest.Mock).mockResolvedValue(1);
      await service.seedTrophies();
      expect(prisma.trophy.create).not.toHaveBeenCalled();
    });

    it('should seed 33 trophies if none exist', async () => {
      (prisma.trophy.count as jest.Mock).mockResolvedValue(0);
      (prisma.trophy.create as jest.Mock).mockResolvedValue({});
      await service.seedTrophies();
      expect(prisma.trophy.create).toHaveBeenCalledTimes(33);
    });
  });
});
```

---

### 11. **Inconsistent Error Messages** ⚠️ BAJO

**Problema:** Mensajes de error en español e inglés:

```typescript
// ANTES (inconsistente)
throw new NotFoundException('Usuario no encontrado.'); // En español
throw new BadRequestException('Conflict or validation error'); // En inglés
```

**Solución:** Standarizar a español:

```typescript
// DESPUÉS (consistente)
throw new NotFoundException('Usuario no encontrado.');
throw new BadRequestException('Conflicto de horario detectado.');
throw new BadRequestException('Validación fallida.');
```

---

### 12. **No Rate Limiting or Request Validation Size** ⚠️ BAJO

**Problema:** No hay límites en:
- Batch requests (setMultipleTimetables with 1000 DTOs?)
- Historic data queries (no maxResults?)
- Trophy check operations

**Solución:**

```typescript
// schedule/dto/schedule.dto.ts
export class SetMultipleTimetablesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)  // Limit batch size
  @ValidateNested()
  @Type(() => CreateTimetableDto)
  timetables: CreateTimetableDto[];
}

// academic-history/dto/academic-history.dto.ts
export class AcademicHistoryFilterDto {
  @IsNumber()
  @Min(1)
  @Max(500) // Limit results per request
  limit?: number;
}
```

---

## 💡 RECOMENDACIONES DE MEJORA

### Mejora #1: Agregar Paginación a getTimetables()

```typescript
async getTimetables(
  userEmail: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: TimetableDto[]; total: number }> {
  const user = await this.prisma.user.findUnique({...});
  
  const [timetables, total] = await Promise.all([
    this.prisma.timetable.findMany({
      where: { userId: user.id },
      include: { subject: true },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.timetable.count({ where: { userId: user.id } }),
  ]);

  return {
    data: timetables.map(t => this.mapToTimetableDto(t)),
    total,
  };
}
```

---

### Mejora #2: Agregar Caching para Dashboard

```typescript
// dashboard/services/dashboard.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getDashboardData(userEmail: string): Promise<DashboardDataDto> {
    const cacheKey = `dashboard:${userEmail}`;
    
    // Check cache
    const cached = await this.cacheManager.get<DashboardDataDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for dashboard: ${userEmail}`);
      return cached;
    }

    // Compute
    const data = { /* ... */ };

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, data, 60 * 60 * 1000);
    
    return data;
  }
}
```

Install: `npm install @nestjs/cache-manager cache-manager`

---

### Mejora #3: Validar Enums en Base de Datos

```typescript
// Usar CHECK constraints en migraciones:
-- En SQLite:
CREATE TABLE timetable (
  period TEXT NOT NULL CHECK(period IN ('AM', 'PM', 'EVENING')),
  dayOfWeek INTEGER NOT NULL CHECK(dayOfWeek >= 1 AND dayOfWeek <= 6)
);

-- Actual: ✅ Ya lo tiene en las migraciones
```

---

### Mejora #4: Agregar Índices Compuestos para Queries Frecuentes

```typescript
// Prisma schema enhancement
model AcademicRecord {
  // ...
  @@index([userId, statusDate])  // Para queries filtradas por fecha
  @@index([userId, status])      // Para queries de estado
}

model Timetable {
  // ...
  @@index([userId, dayOfWeek])   // Para queries de conflictos
}
```

---

### Mejora #5: Usar Database Transactions para Operaciones Complejas

```typescript
async setMultipleTimetables(
  userEmail: string,
  dtos: CreateTimetableDto[]
): Promise<TimetableDto[]> {
  return this.prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({...});
    
    const results = [];
    for (const dto of dtos) {
      const record = await tx.timetable.upsert({...});
      results.push(this.mapToTimetableDto(record));
    }
    
    return results;
  });
}
```

---

### Mejora #6: Agregar DTOs de Paginación Reutilizable

```typescript
// shared/dto/pagination.dto.ts
export class PaginationQueryDto {
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 50;

  @IsNumber()
  @Min(1)
  page?: number = 1;
}

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 📊 Tabla de Resumen: Problemas vs Severidad

| # | Problema | Severity | Fix Time | Impacto |
|---|----------|----------|----------|--------|
| 1 | Type safety (`any`) | 🔴 CRÍTICO | 2h | Alto (violates requirements) |
| 2 | Dashboard helpers typing | 🔴 CRÍTICO | 1h | Alto |
| 3 | Sequential batch operations | 🟠 SERIO | 30m | Medio (perf) |
| 4 | Missing input validation | 🟠 SERIO | 1h | Medio |
| 5 | Incomplete trophy logic | 🟠 SERIO | 3h | Alto (features incomplete) |
| 6 | Long methods | 🟡 MEDIO | 1h | Bajo |
| 7 | Code repetition (DRY) | 🟡 MEDIO | 30m | Bajo |
| 8 | Missing logging | 🟡 MEDIO | 1h | Bajo |
| 9 | No tests | 🟡 MEDIO | 4h | Alto (best practices) |
| 10 | Inconsistent messages | 🟢 BAJO | 30m | Muy bajo |
| 11 | No rate limiting | 🟢 BAJO | 1h | Muy bajo |
| 12 | No caching | 🟢 BAJO | 1h | Muy bajo |

**Total fix time:** ~16 horas para critical + serious issues

---

## ✅ Checklist de Calidad

- [x] TypeScript compila sin errores
- [x] Migraciones SQL correctas
- [x] DTOs con validación
- [x] Controllers con Swagger docs
- [x] Authorization guards
- [x] Manejo de errores básico
- [ ] No `any` types (CRÍTICO - fix needed)
- [ ] Unit tests (importante)
- [ ] Input size validation
- [ ] Rate limiting
- [ ] Request logging
- [ ] Performance optimization (batch queries)
- [ ] Complete business logic (trophies)
- [ ] Consistent error messages
- [ ] Code reusability improvements

---

## 🎯 Recomendación Final

**Status:** ⚠️ **MERGE PENDIENTE FIXES**

**Por qué:**
- El código compila y las migraciones están correctas ✅
- Pero viola el requirement de "tipado fuerte sin `any`" ❌
- Y hay lógica incompleta en trofeos (15+ TODOs) ❌

**Pasos antes de merge a main:**

1. **Urgente** (antes de testing):
   - [ ] Eliminar todos los `any` types (Problema #1-2) - **2h**
   - [ ] Completar lógica de trofeos (Problema #5) - **3h**

2. **Importante** (antes de deploy):
   - [ ] Agregar input validation faltante (Problema #4) - **1h**
   - [ ] Optimizar Performance batches (Problema #3) - **30m**
   - [ ] Agregar logging (Problema #8) - **1h**

3. **Recomendado** (post-release):
   - [ ] Agregar unit tests - **4h**
   - [ ] Implementar caching - **1h**
   - [ ] Refactor métodos largos - **1.5h**

**Total antes de deploy:** ~7.5 horas de trabajo

---

## 📝 Notas de Implementación

1. **Para eliminar `any` types:**
   - Nueva carpeta: `server/src/shared/types/database.types.ts`
   - Definir todos los tipos Prisma extendidos allí
   - Re-importar en todos los servicios

2. **Para completar tofeos:**
   - Crear `server/src/modules/trophy/helpers/trophy-criteria.ts`
   - Implementar 15+ funciones de evaluación
   - Refactorizar `evaluateTrophyCriteria()` para usar helpers

3. **Para tests:**
   - Instalar: `npm install --save-dev @nestjs/testing jest @types/jest`
   - Crear `*.spec.ts` para cada servicio crítico
   - Mock de PrismaService

---

**Fin del Code Review**

