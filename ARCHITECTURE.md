# 🏗️ Architecture Guide - Mi Carrerita

## 📊 Visión General

Mi Carrerita es una aplicación de **dos capas** (Client-Server) con arquitectura modular basada en **características (features)**.

```
┌─────────────────────────┐
│   CLIENTE (Vite+React)  │
│  ├─ Features            │
│  ├─ Shared Components   │
│  └─ State Management    │
└──────────────┬──────────┘
               │ (REST API + WebSocket, JWT)
┌──────────────▼──────────┐
│ SERVIDOR (NestJS)       │
│  ├─ Modules             │
│  ├─ Services            │
│  ├─ Controllers         │
│  └─ Prisma ORM          │
├──────────────┬──────────┤
│   SQLite / PostgreSQL   │
└─────────────────────────┘
```

---

## 🎯 Principios de Diseño

1. **Feature-Based Modular Structure**
   - Cada feature es independiente
   - Mínimas acoplaciones entre features
   - Compartir solo a través de `shared/`

2. **Separation of Concerns**
   - Controllers: Manejo de HTTP
   - Services: Lógica de negocio
   - DTOs: Validación de entrada
   - Entities: Modelos de datos

3. **Type Safety**
   - TypeScript en ambos lados
   - Prisma para type-safe queries
   - DTOs validados con class-validator

4. **DRY (Don't Repeat Yourself)**
   - Funciones helper en `shared/lib/`
   - Componentes reutilizables
   - Constantes centralizadas

---

## 🖥️ ARQUITECTURA CLIENTE

### Estructura de Carpetas

```
client/src/
├── app/                          # Root component
│   └── App.tsx                   # Router principal
│
├── features/                     # Módulos de funcionalidad
│   ├── academic/                 # Grafo de carrera
│   │   ├── components/
│   │   │   ├── CareerGraph.tsx
│   │   │   ├── SubjectNode.tsx
│   │   │   ├── HistoryTable.tsx
│   │   │   ├── ProgressTrack.tsx
│   │   │   └── SubjectUpdatePanel.tsx
│   │   ├── store/
│   │   │   └── academic-store.ts
│   │   └── index.tsx             # Barrel export
│   │
│   ├── auth/                     # Autenticación
│   │   ├── components/
│   │   │   └── AuthModal.tsx
│   │   ├── store/
│   │   │   └── auth-store.ts
│   │   ├── lib/
│   │   │   ├── auth.ts           # Token storage
│   │   │   └── api.ts            # authFetch wrapper
│   │   └── index.tsx
│   │
│   ├── dashboard/                # Estadísticas
│   ├── landing/                  # Landing page
│   ├── recommendations/          # Motor de recomendaciones
│   └── trophies/                 # Logros
│
├── shared/                       # Código compartido
│   ├── components/               # Componentes reutilizables
│   │   ├── BackgroundFX.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layouts principales
│   │   ├── AppHeader.tsx
│   │   ├── SideNav.tsx
│   │   └── MainLayout.tsx
│   │
│   ├── ui/                       # Componentes de UI base
│   │   ├── RetroButton.tsx
│   │   ├── RetroCard.tsx
│   │   ├── RetroBadge.tsx
│   │   └── RetroLoading.tsx
│   │
│   ├── lib/                      # Funciones helper
│   │   ├── utils.ts              # Funciones utilitarias
│   │   ├── graph.ts              # Algoritmos de grafos
│   │   └── constants.ts          # Constantes compartidas
│   │
│   ├── types/                    # Tipos TypeScript
│   │   ├── academic.ts
│   │   └── auth.ts
│   │
│   ├── styles/                   # Design system
│   │   ├── design-system-retro.ts
│   │   └── globals.css
│   │
│   └── index.ts                  # Barrel export
│
├── main.tsx                      # Entry point
├── index.css                     # Global styles
├── vite.config.ts               # Configuración Vite
└── tsconfig.json                # TypeScript config
```

### Flujo de Datos

```
┌──────────────────────────────────────┐
│   App.tsx (Router, Auth State)       │
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐  │
│ │    useAuthStore / useAcademicStore  │  ← Zustand (State Management)
│ └────────────┬───────────────────┘  │
│              │                        │
│ ┌────────────▼───────────────────┐  │
│ │  Components (Features)         │  │  ← User Events
│ │  • CareerGraph.tsx             │  │
│ │  • AuthModal.tsx               │  │
│ └────────────┬───────────────────┘  │
│              │                        │
│ ┌────────────▼───────────────────┐  │
│ │  authFetch (with JWT intercept)│  │  ← API Calls
│ └────────────┬───────────────────┘  │
│              │                        │
└──────────────┼────────────────────────┘
               │
        ┌──────▼──────┐
        │API (Backend)│
        └─────────────┘
```

### Zustand Store Pattern

```typescript
// Example: auth-store.ts
import create from 'zustand';

type AuthStore = {
  user: User | null;
  token: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  
  login: async (email) => {
    const response = await authFetch('/auth/google');
    set({ user: response.user, token: response.token });
  },
  
  logout: () => {
    set({ user: null, token: null });
  },
}));

// Usage in Component:
const { user, login } = useAuthStore();
```

---

## 🔙 ARQUITECTURA SERVIDOR

### Estructura de Carpetas

```
server/src/
├── app.module.ts                      # Root module
│
├── modules/                           # Feature modules
│   ├── auth/                          # Autenticación OAuth
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── strategies/                # Passport strategies
│   │   │   ├── google.strategy.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── dto/
│   │   │   └── ...
│   │   ├── entities/
│   │   │   └── ...
│   │   └── auth.module.ts
│   │
│   └── academic-career/               # Gestión de carrera
│       ├── controllers/
│       │   └── academic-career.controller.ts
│       ├── services/
│       │   └── academic-career.service.ts
│       ├── dto/
│       │   ├── subject-node.dto.ts
│       │   └── update-subject-record.dto.ts
│       ├── entities/
│       │   └── academic-career.entity.ts
│       └── academic-career.module.ts
│
├── prisma/                            # Base de datos
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── schema.prisma                  # Definición de BD
│
├── common/                            # Código compartido
│   ├── constants/
│   │   ├── academic-enums.ts          # SubjectStatus, etc.
│   │   └── academic-status.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts  # @CurrentUser()
│   ├── exceptions/
│   │   └── http-exception.filter.ts   # Global error handler
│   ├── utils/
│   │   ├── logger.ts                  # AppLogger
│   │   ├── api-response.ts            # ApiResponseBuilder
│   │   └── validators.ts              # Custom validators
│   └── docs/
│       └── swagger.ts                 # Swagger setup
│
├── data/                              # Dados de ejemplo
│   └── plan-2023.ts
│
├── config/                            # Configuración
│   └── database.config.ts
│
├── main.ts                            # Entry point
└── app.module.ts                      # Root DI container
```

### Patrón MVC + Services

```
┌────────────────────────────────────┐
│      HTTP Request                  │
└────────────────┬───────────────────┘
                 │
        ┌────────▼──────────┐
        │   Controller      │  ← Manejo HTTP
        │ • Validación      │  ← DTOs
        │ • Autorización    │  ← Guards
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │    Service        │  ← Lógica de negocio
        │ • Funciones       │  ← Algoritmos
        │ • Cache           │  ← Estado
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │   Prisma ORM      │  ← Type-safe queries
        │ • Models          │  ← Relaciones
        │ • Transactions    │  ← Integridad
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │   Database        │  ← SQLite/PostgreSQL
        │ • Tables          │  ← Data persistence
        │ • Indexes         │  ← Performance
        └───────────────────┘
```

### Ejemplo Completo: Update Subject

```typescript
// academic-career.controller.ts
@Patch('subjects/:subjectId')
@UseGuards(JwtAuthGuard)
async updateSubject(
  @Param('subjectId') subjectId: string,
  @Body() dto: UpdateSubjectRecordDto,
  @CurrentUser() user: User,  // ← Custom decorator
) {
  return this.service.updateSubjectRecord(subjectId, user.id, dto);
}

// academic-career.service.ts
async updateSubjectRecord(
  subjectId: string,
  userId: string,
  dto: UpdateSubjectRecordDto,
) {
  // Validar que el subject existe
  const subject = await this.prisma.subject.findUnique({
    where: { id: subjectId },
  });
  
  if (!subject) throw new NotFoundException('Subject not found');
  
  // Actualizar o crear registro académico
  const record = await this.prisma.academicRecord.upsert({
    where: { userId_subjectId: { userId, subjectId } },
    create: { userId, subjectId, ...dto },
    update: dto,
  });
  
  return record;
}
```

---

## 🔐 Flujo de Autenticación

```
┌─── Cliente ────────────────────────────┐
│                                         │
│  1. Usuario: Click "Login with Google" │
│                      │                  │
│                      ▼                  │
│  2. Redirect a /auth/google             │
│                      │                  │
└──────────────────────┼──────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Servidor (Google Strategy) │
        │                             │
        │  3. Redirige a Google Auth  │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────────┐
        │   Google OAuth Flow     │
        │                         │
        │  4. Usuario autoriza    │
        └──────────┬──────────────┘
                   │
┌──────────────────▼──────────────┐
│  Servidor (Callback Handler)    │
│                                 │
│  5. Recibe code de Google       │
│  6. Intercambia por profile     │
│  7. Crea/Actualiza User en BD   │
│  8. Genera JWT access token     │
│  9. Genera refresh token        │
│  10. Almacena en httpOnly cookie│
└──────────────┬──────────────────┘
               │
┌──────────────▼───────────────────────┐
│  Cliente                              │
│                                       │
│  11. Recibe accessToken              │
│  12. Almacena en localStorage         │
│  13. Redirige a /app                 │
│  14. Usa JWT en Authorization header │
└───────────────────────────────────────┘
```

---

## 📦 Gestión de Estado

### Cliente (Zustand)

**Ventajas:**
- Ligeramente (2KB)
- No boilerplate (sin reducers)
- Fácil testing
- Permisos explícitos

```typescript
// auth-store.ts
export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  
  // Acciones
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  reset: () => set({ user: null, token: null }),
  
  // Computed
  isAuthenticated: () => get().user !== null,
}));
```

### Servidor (Dependency Injection)

**Ventajas:**
- IoC container (NestJS)
- Inyección automática
- Testing con mocks

```typescript
// academic-career.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [AcademicCareerController],
  providers: [AcademicCareerService],
})
export class AcademicCareerModule {}

// career.service.ts - Inyección automática
@Injectable()
export class AcademicCareerService {
  constructor(private prisma: PrismaService) {}
  
  async getCareerGraph(userId: string) {
    return this.prisma.subject.findMany({
      include: { correlativities: true },
    });
  }
}
```

---

## 🔄 Ciclos de Vida

### Cliente
```
1. App monta
2. useEffect: Verifica si hay token en localStorage
3. Si existe token: Llama a /auth/me
4. Si válido: Restaura sesión
5. Si no: Muestra AuthModal
```

### Servidor
```
1. App inicia
2. ConfigModule carga .env
3. PrismaService conecta a BD
4. Modules se registran en DI container
5. Swagger genera documentación
6. Escucha en puerto 3000
```

---

## 🧪 Testing Strategy

### Cliente (Vitest + React Testing Library)
```typescript
// CareerGraph.test.tsx
import { render, screen } from '@testing-library/react';
import CareerGraph from './CareerGraph';

test('renders subject nodes', () => {
  render(<CareerGraph />);
  expect(screen.getByText(/Programación I/i)).toBeInTheDocument();
});
```

### Servidor (Jest + NestJS Testing)
```typescript
// academic-career.service.spec.ts
describe('AcademicCareerService', () => {
  let service: AcademicCareerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AcademicCareerService, PrismaMock],
    }).compile();
    
    service = module.get(AcademicCareerService);
  });

  it('should return career graph', async () => {
    const result = await service.getCareerGraph('user-id');
    expect(result).toBeDefined();
  });
});
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────┐
│    Vercel / Netlify (Frontend)      │
│  ├─ Vite build output               │
│  ├─ SPA React                       │
│  └─ Static assets                   │
└────────────┬────────────────────────┘
             │ API calls
┌────────────▼────────────────────────┐
│   Railway / Heroku (Backend)        │
│  ├─ NestJS server                   │
│  ├─ Prisma ORM                      │
│  └─ JWT auth                        │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│  Cloud Database (PostgreSQL)        │
│  ├─ Managed database                │
│  ├─ Automatic backups               │
│  └─ SSL connection                  │
└─────────────────────────────────────┘
```

---

## 📐 Design Patterns

| Patrón | Dónde | Ejemplo |
|--------|-------|---------|
| **MVC** | Servidor | Controller → Service → Repository |
| **Dependency Injection** | Servidor | @Injectable(), constructor injection |
| **Custom Hooks** | Cliente | useAuthStore, useAcademicStore |
| **Adapter** | Cliente | authFetch = Adapter sobre Axios |
| **Strategy** | Servidor | Passport strategies (Google, JWT) |
| **Decorator** | Servidor | @UseGuards, @CurrentUser |
| **Singleton** | Servidor | PrismaService, Logger |
| **Factory** | Cliente | Zustand store creation |

---

## 🔗 Integración de Features

Cuando agregues una nueva feature:

1. **Crear carpeta en `client/src/features/`**
2. **Estructura:**
   - `components/` (Componentes React)
   - `store/` (Zustand store si aplica)
   - `index.tsx` (Barrel export)

3. **Crear módulo en `server/src/modules/`**
4. **Estructura:**
   - `controllers/` (Endpoints)
   - `services/` (Lógica)
   - `dto/` (Validación)
   - `entities/` (Tipos)
   - `*.module.ts` (Registro)

5. **Importar en App/AppModule**

---

## 📚 Referencias

- [NestJS Architecture](https://docs.nestjs.com/modules)
- [React Best Practices](https://react.dev)
- [Zustand](https://github.com/pmndrs/zustand)
- [Prisma](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
