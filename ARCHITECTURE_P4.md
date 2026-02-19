# Arquitectura P4: Backend Features Completas

## 1. RESUMEN EJECUTIVO

**Objetivo**: Implementar 4 subsistemas de backend con **tipado fuerte** (cero `any`), DTOs con validación, y nuevas tablas de BD según sea necesario.

**Subsistemas**:
1. **Dashboard Analytics** (6+ charts)  
2. **Schedule Management** (conflict detection)  
3. **Academic History** (filtering, editing, deletion)  
4. **Trophy System** (33 trophies, tier-based)

**Enfoque**:
- DDL first (schema changes)
- DTOs/Types (strong typing)
- Services (business logic)
- Controllers (endpoints)
- Code review & iterate

---

## 2. FEATURE 1: DASHBOARD ANALYTICS

### 2.1 Requerimientos

- **6+ gráficos de rendimiento académico**:
  1. **Rendimiento (Avg Grade per semester)** – Line/Bar chart  
  2. **Eficacia (% success per semester)** – Line/Bar chart  
  3. **Carga Académica (hours studied vs passed)** – Grouped Bar chart  
  4. **Volumen de Materias (count by status)** – Pie/Stacked bar  
  5. **Scatter: Difficulty vs Grade** – Scatter plot (x=perceived difficulty 1-10, y=grade)
  6. **Burn-up Accumulative** – Line chart (% subjects passed cumulative)  
  7. **Top 5 Mata-promedios & Salvavidas** – Bar chart (hardest/easiest subjects you struggled with)

### 2.2 Análisis de Datos

**Calculos requeridos:**
- Per-semester aggregations (year + semester → avg grade, success %, hours, counts)
- Subject difficulty distribution (user's perceived vs actual performance)
- Cumulative progress (total subjects vs completed)
- Subject ranking by difficulty & performance

**Fuentes de datos:**
- `AcademicRecord`: finalGrade, difficulty (1-10 user input), status, statusDate, subjectId
- `Subject`: hours, year, name
- Lógica: un semestre = year + [1|2] (inferir de quarter o asociar en BD)

**Problema**: Actual BD no tiene "semester" explícitamente. Opciones:
- **Opción A**: Inferir de `year` (asumiendo 2 semestres/year)  
- **Opción B**: Agregar `semester` field a Subject  
- **Recomendación**: **Opción A** por ahora (menos cambios); si es insuficiente, agregar después.

### 2.3 Entidades/Tablas Nuevas

**SI se elige Opción B** (agregar semester a Subject):
```sql
ALTER TABLE Subject ADD COLUMN semester INT CHECK (semester IN (1, 2));
```

**Nuevas tablas BD** (opcionales, para cacheo):
- `SubjectDifficulty`: userId, subjectId, userPerceived (1-10), actualGrade, lastUpdated
  - Usar si frecuencia de queries es alta; si no, calcular ad-hoc.

**Recomendación**: NO agregar tablas de cacheo aún (YAGNI); calcular desde AcademicRecord + Subject.

### 2.4 DTOs

**Entrada**: ninguna (GET endpoint)

**Salidas** (todas con tipos completos):

```typescript
// Dashboard (retorno general)
interface DashboardDataDto {
  performanceChart: PerformanceChartDto;
  efficacyChart: EfficacyChartDto;
  academicLoadChart: AcademicLoadChartDto;
  subjectVolumeChart: SubjectVolumeChartDto;
  difficultyScatterChart: DifficultyScatterChartDto;
  burnUpChart: BurnUpChartDto;
  subjectRankingsChart: SubjectRankingsChartDto;
  summary: DashboardSummaryDto;
}

// Per-semester data
interface SemesterDataPoint {
  year: number;
  semester: number; // 1 or 2
  label: string; // "2024 Q1" or "2024 Sem 1"
  avgGrade: number | null;
  successPercentage: number; // 0-100
  totalHours: number;
  completedHours: number;
  subjectCount: number;
  passedCount: number;
}

// 1. Performance Chart
interface PerformanceChartDto {
  data: SemesterDataPoint[];
  // Line: year+semester vs avgGrade
}

// 2. Efficacy Chart
interface EfficacyChartDto {
  data: SemesterDataPoint[];
  // Line: year+semester vs successPercentage
}

// 3. Academic Load Chart
interface AcademicLoadChartDto {
  data: SemesterDataPoint[];
  // Grouped bar: semester vs (studiedHours, passedHours)
}

// 4. Subject Volume Chart
interface SubjectVolumeChartDto {
  data: Array<{
    status: SubjectStatus;
    count: number;
  }>;
  // Pie/Stacked: status distribution
}

// 5. Difficulty Scatter Chart
interface DifficultyScatterPoint {
  subjectId: string;
  subjectName: string;
  userPerceivedDifficulty: number; // 1-10
  actualGrade: number? | null;
  status: SubjectStatus;
}

interface DifficultyScatterChartDto {
  data: DifficultyScatterPoint[];
  // Scatter: x=perceived (1-10), y=grade, bubble=status color
}

// 6. Burn-up Chart
interface BurnUpPoint {
  year: number;
  semester: number;
  label: string;
  cumulativePercentage: number; // 0-100
  cumulativeCount: number;
  totalSubjects: number;
}

interface BurnUpChartDto {
  data: BurnUpPoint[];
  // Line: semester vs cumulative %
}

// 7. Subject Rankings (Top 5 hardest + easiest by performance)
interface SubjectRankingDto {
  subjectId: string;
  subjectName: string;
  year: number;
  avgGrade: number | null;
  userPerceivedDifficulty: number | null;
  status: SubjectStatus;
  category: 'mata-promedio' | 'salvavidas'; // hardest or easiest you struggled with
}

interface SubjectRankingsChartDto {
  mataPromedios: SubjectRankingDto[]; // Top 5 hardest subjects (low grades despite effort)
  salvavidas: SubjectRankingDto[]; // Top 5 easiest subjects (high grades, low difficulty perceived)
}

// Summary / KPIs
interface DashboardSummaryDto {
  totalSubjects: number;
  completedSubjects: number;
  completionPercentage: number; // 0-100
  totalHours: number;
  completedHours: number;
  overallAverageGrade: number | null;
  overallSuccessRate: number; // 0-100
  currentStreak?: number; // semesters with >80% avg (optional)
}
```

### 2.5 Service Methods

```typescript
// DashboardService
class DashboardService {
  async getDashboardData(userEmail: string): Promise<DashboardDataDto>;
  private computePerformanceData(records): SemesterDataPoint[];
  private computeEfficacyData(records): SemesterDataPoint[];
  // ... etc for other charts
}
```

### 2.6 Controller Endpoints

```
GET /dashboard → DashboardDataDto (all 6+ charts + summary)
```

### 2.7 Database Impact

**Minimal**: No new tables needed (yet).  
**Possible future**: Add `semester` to Subject if filtering becomes complex.

---

## 3. FEATURE 2: SCHEDULE MANAGEMENT (RECOMMENDATIONS)

### 3.1 Requerimientos

- **Gestión de horarios** (timeslots):
  - AM: 8-12  
  - PM: 14-18  
  - Evening: 19-23  
  - Days: Mon-Sat (no domingo)
  - Conflict detection: no overlap entre timetables de materias recomendadas

- **Integration con Recommendations**:
  - User selecciona timeslots disponibles
  - System genera recomendacion sin conflictos
  - Fix toggle logic: tap = change → "mantenida"; tap again = delete

### 3.2 Entidades/Tablas Nuevas

```sql
-- Timetable: mapeo de materia a horarios
CREATE TABLE Timetable (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  subjectId UUID NOT NULL,
  period TEXT NOT NULL, -- 'AM', 'PM', 'EVENING'
  dayOfWeek INT NOT NULL, -- 1=Mon, 6=Sat
  createdAt TIMESTAMP DEFAULT now(),
  UNIQUE(userId, subjectId, period, dayOfWeek),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (subjectId) REFERENCES Subject(id)
);

-- RecommendedSubject: materia recomendada + estado
CREATE TABLE RecommendedSubject (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  subjectId UUID NOT NULL,
  status TEXT NOT NULL, -- 'SUGGESTED', 'MANTENIDA', 'DELETED'
  recommendedAt TIMESTAMP DEFAULT now(),
  takenAt TIMESTAMP NULL,
  UNIQUE(userId, subjectId),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (subjectId) REFERENCES Subject(id)
);
```

### 3.3 DTOs

**Entrada**:

```typescript
// Create timetable entry
interface CreateTimetableDto {
  subjectId: string;
  period: 'AM' | 'PM' | 'EVENING';
  dayOfWeek: number; // 1-6 (Mon-Sat)
}

// Bulk create timetable for recommendation
interface SetTimetableDto {
  timetables: CreateTimetableDto[];
  // User selecciona todos sus timeslots antes de generar recomendacion
}

// Toggle recommendation status
interface UpdateRecommendationStatusDto {
  subjectId: string;
  status: 'SUGGESTED' | 'MANTENIDA' | 'DELETED';
  // If MANTENIDA: must provide timetable entry
  timetable?: CreateTimetableDto;
}

// Generate recommendation with conflicts check
interface GenerateRecommendationDto {
  // Empty or specify constraints
}
```

**Salidas**:

```typescript
interface TimetableDto {
  id: string;
  subjectId: string;
  subjectName: string;
  period: 'AM' | 'PM' | 'EVENING';
  dayOfWeek: number;
  dayLabel: string; // 'Mon', 'Tue', etc.
}

interface ConflictDto {
  subject1Id: string;
  subject1Name: string;
  subject2Id: string;
  subject2Name: string;
  period: string;
  dayOfWeek: number;
  dayLabel: string;
}

interface RecommendationResultDto {
  recommendedSubjects: Array<{
    id: string;
    subjectId: string;
    subjectName: string;
    status: 'SUGGESTED' | 'MANTENIDA';
    timetables?: TimetableDto[];
  }>;
  conflicts: ConflictDto[]; // empty if no conflicts
  isConflict: boolean;
}
```

### 3.4 Service Methods

```typescript
// ScheduleService & RecommendationService
class ScheduleService {
  async setTimetables(userId: string, timetables: CreateTimetableDto[]): Promise<TimetableDto[]>;
  async getTimetables(userId: string): Promise<TimetableDto[]>;
  async deleteTimetable(userId: string, subjectId: string): Promise<void>;
  
  async checkConflicts(userId: string, newTimetable?: CreateTimetableDto[]): Promise<ConflictDto[]>;
  private detectConflicts(timetables: TimetableDto[]): ConflictDto[];
}

class RecommendationService {
  async generateRecommendation(userEmail: string): Promise<RecommendationResultDto>;
  async updateRecommendationStatus(userEmail: string, update: UpdateRecommendationStatusDto): Promise<void>;
  async getRecommendations(userEmail: string): Promise<RecommendationResultDto>;
}
```

### 3.5 Controller Endpoints

```
POST /recommendations/timetable → SetTimetableDto → TimetableDto[]
GET  /recommendations/timetable → TimetableDto[]
DELETE /recommendations/timetable/:subjectId → void

POST /recommendations/generate → GenerateRecommendationDto → RecommendationResultDto
PATCH /recommendations/:subjectId → UpdateRecommendationStatusDto → void
GET /recommendations → RecommendationResultDto

GET /recommendations/conflicts → ConflictDto[]
```

### 3.6 Database Impact

**New tables**: Timetable, RecommendedSubject  
**Migrations**: Create both tables with FK constraints, unique indexes  

---

## 4. FEATURE 3: ACADEMIC HISTORY

### 4.1 Requerimientos

- **Dynamic datatable** con filtros:
  - By date range (statusDate)
  - By grade (finalGrade)
  - By code (Subject.planCode)
  - By year (Subject.year)
  - By semester (inferred)
  - By status (APROBADA, REGULARIZADA, etc.)
  - **Intermediate vs Final** distinction

- **Row operations**:
  - Click row → edit → modal with fields (status, finalGrade, difficulty, notes)
  - Delete single row
  - Delete all history

### 4.2 Entidades/Tablas

**No new tables**: AcademicRecord ya exists.  
**Possible enhancement**: Add `isIntermediate: Boolean` field to distinguish intermediate grades.

```sql
ALTER TABLE AcademicRecord ADD COLUMN isIntermediate BOOLEAN DEFAULT false;
```

### 4.3 DTOs

**Entrada**:

```typescript
interface AcademicHistoryFilterDto {
  dateFrom?: string; // ISO date
  dateTo?: string;
  gradeMin?: number;
  gradeMax?: number;
  planCode?: string;
  year?: number;
  semester?: number;
  status?: SubjectStatus;
  isIntermediate?: boolean;
  sortBy?: 'date' | 'grade' | 'code' | 'status'; // default: date DESC
  page?: number; // pagination
  limit?: number;
}

interface EditAcademicRecordDto {
  status: SubjectStatus;
  finalGrade?: number;
  difficulty?: number; // 1-10
  notes?: string;
  isIntermediate?: boolean;
  statusDate?: string;
}
```

**Salidas**:

```typescript
interface AcademicHistoryRowDto {
  id: string;
  subjectId: string;
  subjectName: string;
  planCode: string;
  year: number;
  semester: number;
  hours: number;
  status: SubjectStatus;
  finalGrade: number | null;
  difficulty: number | null;
  notes: string | null;
  statusDate: DateTime | null;
  isIntermediate: boolean;
}

interface AcademicHistoryPageDto {
  data: AcademicHistoryRowDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 4.4 Service Methods

```typescript
class AcademicHistoryService {
  async getHistory(
    userEmail: string,
    filter: AcademicHistoryFilterDto
  ): Promise<AcademicHistoryPageDto>;

  async updateRecord(
    userEmail: string,
    recordId: string,
    update: EditAcademicRecordDto
  ): Promise<AcademicHistoryRowDto>;

  async deleteRecord(userEmail: string, recordId: string): Promise<void>;
  async deleteAll(userEmail: string): Promise<void>;

  private inferSemester(year: number, dateOrOrder?: any): number;
}
```

### 4.5 Controller Endpoints

```
GET /history → AcademicHistoryPageDto (with query filters)
PATCH /history/:recordId → EditAcademicRecordDto → AcademicHistoryRowDto
DELETE /history/:recordId → void
DELETE /history → void (delete all)
```

### 4.6 Database Impact

**Optional**: Add `isIntermediate` boolean to AcademicRecord.  
**Minimal migration**: Just add column with default false.  

---

## 5. FEATURE 4: TROPHY SYSTEM (33 TROPHIES)

### 5.1 Requerimientos

**33 Trophies**:
- 15 Bronze  
- 10 Silver  
- 7 Gold  
- 1 Platinum

**Multi-dimensional tracking**:
- Progress (unlocked yet?)
- Subjects involved
- Grades achieved
- Intermediate degree completion
- Custom fields per trophy

### 5.2 Trophies List (ejemplo)

```
BRONZE (15):
  1. First Subject Completed
  2. Streak: 3 Consecutive Passes
  3. Perfect Score (100)
  4. Comeback: 0→Pass
  5. Difficult Subject Passed (difficulty ≥ 8)
  6. All Optionals Completed
  7. Semester Average ≥ 90
  8. No Failures in Year
  9. 10 Subjects Completed
  10. Early Bird (completed before due semester)
  ... (5 more)

SILVER (10):
  1. Halfway There (50% subjects passed)
  2. Two Semesters Clean (all passed in 2 semesters)
  3. Master of Balance (avg 80+, no single low grade)
  4. Intermediate Degree Completed
  ... (6 more)

GOLD (7):
  1. Complete Carrer (all subjects passed)
  2. High Achiever (avg ≥ 85)
  3. Speed Runner (completed in <2.5 years)
  ... (4 more)

PLATINUM (1):
  1. Legend (all gold trophies + avg ≥ 90 + zero retakes)
```

### 5.3 Entidades/Tablas

```sql
-- Trophy definition (unchanging)
CREATE TABLE Trophy (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 'FIRST_SUBJECT', 'PERFECT_SCORE', etc.
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL, -- 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'
  icon URL,
  rarity INT, -- 1-100 (how many users have it)
  criteria TEXT, -- JSON description of unlock logic
  createdAt TIMESTAMP DEFAULT now()
);

-- User trophy progress
CREATE TABLE UserTrophy (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  trophyId UUID NOT NULL,
  unlockedAt TIMESTAMP NULL, -- if NULL, not yet unlocked
  progress INT DEFAULT 0, -- 0-100 % (for trophies with gradual completion)
  metadata JSONB, -- custom data per trophy (subjects, grades, etc.)
  lastUpdated TIMESTAMP DEFAULT now(),
  UNIQUE(userId, trophyId),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (trophyId) REFERENCES Trophy(id)
);
```

### 5.4 DTOs

**Entrada**:

```typescript
// Manual trophy check (admin or debug)
interface CheckTrophiesDto {
  userId: string;
}
```

**Salidas**:

```typescript
interface TrophyDto {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  icon: string;
  rarity: number;
  unlocked: boolean;
  unlockedAt?: DateTime;
  progress: number; // 0-100
  metadata?: Record<string, any>; // custom per trophy
}

interface TrophyCaseDto {
  totalTrophies: number;
  unlockedCount: number;
  unlockedPercentage: number;
  byTier: {
    bronze: { unlocked: number; total: number };
    silver: { unlocked: number; total: number };
    gold: { unlocked: number; total: number };
    platinum: { unlocked: number; total: number };
  };
  trophies: TrophyDto[];
  recentlyUnlocked: TrophyDto[]; // last 5
}
```

### 5.5 Service Methods

```typescript
class TrophyService {
  // Check & unlock trophies
  async checkAndUnlockTrophies(userEmail: string): Promise<TrophyDto[]>;
  
  // Get trophy case
  async getTrophyCase(userEmail: string): Promise<TrophyCaseDto>;
  
  // Individual trophy query
  async getTrophy(userEmail: string, trophyCode: string): Promise<TrophyDto>;
  
  // Internal: unlock logic
  private evaluateTrophy(trophyCode: string, userEmail: string): Promise<boolean>;
  private unlockTrophy(userId: string, trophyId: string, metadata?: any): Promise<void>;
  
  // Internal: seed trophy definitions
  async seedTrophies(): Promise<void>;
}
```

### 5.6 Controller Endpoints

```
GET /trophies → TrophyCaseDto
GET /trophies/:code → TrophyDto
POST /trophies/check → CheckTrophiesDto → TrophyDto[] (unlocked in this check)
```

### 5.7 Database Impact

**New tables**: Trophy, UserTrophy  
**Seeding**: Insert 33 trophy definitions on app initialization  
**Migrations**: Create both tables, add indices on userId + trophyId  

---

## 6. SCHEMA SUMMARY (DDL)

**New migrations**:

1. **20260215_AddScheduleAndRecommendation**:
   - Timetable (userId FK, subjectId FK)  
   - RecommendedSubject (userId FK, subjectId FK)

2. **20260215_AddTrophySystem**:
   - Trophy (global definitions)  
   - UserTrophy (userId FK, trophyId FK)

3. **20260215_EnhanceAcademicRecord** (optional):
   - `isIntermediate` BOOLEAN DEFAULT false

**Total new columns**: 1 (optional)  
**Total new tables**: 4 (Timetable, RecommendedSubject, Trophy, UserTrophy)  

---

## 7. IMPLEMENTATION ORDER (RECOMMENDED)

1. **Phase 1**: DTOs & Types (all 4 features)
   - Create `/dto` files with strong typed interfaces
   - Create `/types` files for internal models
   - Create enums (TrophyTier, Period, etc.)

2. **Phase 2**: Database migrations
   - Apply 3 migrations above
   - Seed Trophy definitions

3. **Phase 3**: Service Layer (business logic)
   - DashboardService (analytics)
   - ScheduleService + RecommendationService (timetable & recommendations)
   - AcademicHistoryService (filtering & editing)
   - TrophyService (evaluation & unlock)

4. **Phase 4**: Controller Endpoints
   - DashboardController
   - ScheduleController
   - HistoryController
   - TrophyController

5. **Phase 5**: Code Review & Iteration
   - Check: no `any` types
   - Check: DTOs have @validation decorators
   - Check: Service error handling (NotFoundException, BadRequestException)
   - Check: Query optimization (no N+1)
   - Check: Edge cases (empty data, null grades, etc.)

---

## 8. TYPING STANDARDS

**All outputs must be typed**, following this structure:

```typescript
// ✅ GOOD
interface DashboardSummaryDto {
  totalSubjects: number;
  completedSubjects: number;
  overallAverageGrade: number | null; // explicit null handling
}

export async getDashboardData(userEmail: string): Promise<DashboardDataDto> {
  // ...
}

// ❌ BAD
interface DashboardSummaryDto {
  totalSubjects: any;
  data: any[];
}

export async getDashboardData(userEmail: string): Promise<any> {
  // ...
}
```

**Validation decorators** (class-validator):

```typescript
import { IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';

export class CreateTimetableDto {
  @IsString()
  subjectId: string;

  @IsNumber()
  @Min(1)
  @Max(6)
  dayOfWeek: number;
}
```

---

## 9. TRADEOFFS & NOTES

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Semester inference** | Opción A (infer from year) | Minimal schema changes; can revisit later |
| **Dashboard caching** | No (calculate ad-hoc) | YAGNI; performance acceptable for most users |
| **Trophy metadata** | JSONB (Postgres) / Text (SQLite) | Flexibility for custom unlock logic |
| **Conflict detection** | On-demand check | Simpler than pre-compute; sufficient for constraints |
| **History pagination** | Limit 50/100 records | Avoid memory overload; user-friendly UX |

---

## 10. NEXT STEPS

**Approval needed?** ¿Esta arquitectura OK? ¿Cambios/ajustes?

Si OK → inicio implementación Fase 1 (DTOs).

