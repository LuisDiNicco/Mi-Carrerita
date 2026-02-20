# Contributing to Mi Carrerita

¡Gracias por considerar contribuir a Mi Carrerita! Este documento te guiará en el proceso.

---

## Código de Conducta

- Sé respetuoso y profésional
- Acepta crítica constructiva
- Enfócate en lo que es mejor para la comunidad
- Reporta comportamientos abusivos a los mantenedores

---

## Cómo Contribuir

### 1. Reporting Bugs

Crea un issue con:

**Título:** `[BUG] Descripción corta del problema`

**Descripción:**
```markdown
## Descripción
Descripción clara y concisa del bug.

## Pasos para Reproducir
1. Haz esto
2. Luego aquello
3. Observa el error

## Comportamiento Esperado
Qué debería pasar

## Comportamiento Actual
Qué pasa realmente

## Screenshots (si aplica)
...

## Entorno
- OS: [Windows 10, macOS 12, Ubuntu 20.04]
- Node: [v18.0.0]
- npm: [v8.0.0]
- Browser: [Chrome 100, Safari 15]

## Logs
```
<pega output completo de error>
```
```

---

### 2. Sugerir Features

Crea un issue con:

**Título:** `[FEATURE] Descripción corta de la idea`

**Descripción:**
```markdown
## Problema a Resolver
Qué problema resuelve esta feature?

## Solución Propuesta
Cómo debería funcionar?

## Alternativas Consideradas
Otras formas de resolver esto?

## Contexto Adicional
Links, referencias, mockups, etc.
```

---

### 3. Hacer Pull Request

#### Paso 1: Setup Local

```bash
# 1. Fork el repositorio en GitHub
# 2. Clone tu fork
git clone https://github.com/TU_USER/Mi-Carrerita.git
cd Mi-Carrerita

# 3. Agrega upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/Mi-Carrerita.git

# 4. Crea rama feature
git checkout -b feature/nueva-funcionalidad
```

#### Paso 2: Hacer Cambios

```bash
# Edita archivos...

# Verifica type-checking
npm run type-check  # en client y server

# Verifica linting
npm run lint        # si aplica
```

#### Paso 3: Commit

```bash
# Formato de commit semántico
git commit -m "feat: agregar nueva funcionalidad"
git commit -m "fix: resolver bug en carrera"
git commit -m "docs: actualizar README"
git commit -m "style: formatear código"
git commit -m "refactor: mejorar estructura"
git commit -m "test: agregar test para feature"
git commit -m "chore: actualizar dependencias"
```

**Tipos de commit válidos:**
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formateo de código (sin lógica)
- `refactor:` Reestructura sin cambiar funcionalidad
- `test:` Agregar o actualizar tests
- `chore:` Cambios en build, deps, etc.

#### Paso 4: Rebase y Push

```bash
# Actualiza con cambios upstream
git fetch upstream
git rebase upstream/main

# Push a tu fork
git push origin feature/nueva-funcionalidad
```

#### Paso 5: Crear Pull Request

En GitHub:
1. Click "New Pull Request"
2. Compara `tu-rama` con `upstream:main`
3. Llena el template:

```markdown
## 📝 Descripción
Qué cambios hiciste y por qué?

## 🔗 Related Issue
Cierra #123

## ✅ Checklist
- [ ] Mi código sigue el estilo del proyecto
- [ ] He hecho type-check (`npm run type-check`)
- [ ] He actualizado documentación
- [ ] Mis cambios no tienen errores ESLint
- [ ] He probado la funcionalidad localmente

## 🖼️ Screenshots (si aplica)
...

## 📚 Referencias
Links a documentación, issues relacionados, etc.
```

---

## Guías de Estilo

### TypeScript

```typescript
// ✅ BIEN
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

const getUser = (userId: string): Promise<User> => {
  return fetch(`/api/users/${userId}`).then(r => r.json());
};

// ❌ MALO
function getUser(userId) {
  return fetch('/api/users/' + userId).then(r => r.json());
}
```

### Componentes React

```typescript
// ✅ BIEN - Componente functional
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;

// ❌ MALO - Sin tipos, sin propósito claro
function Btn(props) {
  return <button onClick={props.o}>{props.c}</button>;
}
```

### NestJS Controllers

```typescript
// ✅ BIEN
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string): Promise<UserDto> {
    return this.userService.findById(id);
  }
}

// ❌ MALO
@Controller('users')
export class UserController {
  constructor(private userService) {}

  @Get()
  get(req) {
    return this.userService.find(req.params.id);
  }
}
```

### Archivos y Carpetas

```
✅ camelCase para archivos/carpetas:
  - userController.ts
  - src/features/academic/

❌ Evitar:
  - UserController.ts (normalmente exporta la clase)
  - user-controller.ts (usa camelCase en código)
```

---

## Testing

### Antes de hacer PR:

```bash
# 1. TypeScript checking
npm run type-check

# 2. Tests (si existen)
npm run test

# 3. Build (asegurar compilación)
npm run build
```

### Agregando Tests

**Cliente (Vitest):**
```typescript
// CareerGraph.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CareerGraph from './CareerGraph';

describe('CareerGraph', () => {
  it('renders subject nodes', () => {
    render(<CareerGraph />);
    expect(screen.getByText(/Programación/i)).toBeInTheDocument();
  });
});
```

**Servidor (Jest):**
```typescript
// academic-career.service.spec.ts
import { Test } from '@nestjs/testing';
import { AcademicCareerService } from './academic-career.service';

describe('AcademicCareerService', () => {
  let service: AcademicCareerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AcademicCareerService],
    }).compile();

    service = module.get(AcademicCareerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## Documentación

- Actualiza [README.md](README.md) para cambios visibles
- Actualiza [SETUP.md](SETUP.md) para cambios de instalación
- Actualiza [API.md](API.md) para nuevos endpoints
- Actualiza [ARCHITECTURE.md](ARCHITECTURE.md) para cambios estructurales

---

## Seguridad

Si encuentras una vulnerabilidad:

**NO la reportes en Issues públicos.** En su lugar:
1. Email a: `tu-email@ejemplo.com` (contacto privado)
2. Incluye detalles completos
3. No compartir públicamente hasta que se arregle

---

## Proceso de Review

Tu PR será revisado por al menos un mantenedor:

1. **Code Review:** Verificamos lógica y estilo
2. **Tests:** Aseguramos cobertura adecuada
3. **Type Safety:** Revisamos tipos TypeScript
4. **Documentación:** Verificamos que esté actualizada

Puede haber feedback. **No toma a pecho las críticas** - queremos mejorar juntos.

---

## Áreas donde Podemos Ayudar

### 🟢 Fáciles (para comenzar)
- [ ] Mejorar documentación
- [ ] Agregar comentarios en código
- [ ] Reportar typos
- [ ] Agregar casos de test

### 🟡 Intermedias
- [ ] Refactorizar código existente
- [ ] Optimizar performance
- [ ] Agregar nuevas features pequeñas
- [ ] Mejorar UX/UI

### 🔴 Avanzadas
- [ ] Diseñar nuevas features grandes
- [ ] Cambios de arquitectura
- [ ] Integraciones complejas
- [ ] Optimizaciones críticas

---

## Recursos

- [SETUP.md](SETUP.md) - Guía de instalación
- [ARCHITECTURE.md](ARCHITECTURE.md) - Diseño del proyecto
- [API.md](API.md) - Documentación de endpoints
- [FAQ.md](FAQ.md) - Preguntas comunes
- [Swagger UI](http://localhost:3000/api/docs) - API interactiva

---

## Preguntas?

- Abre una [Discussion](https://github.com/usuario/Mi-Carrerita/discussions)
- Pregunta en Issues antes de empezar trabajo grande
- Contacta a los mantenedores

---

## Agradecimientos

¡Gracias por contribuir! Tu ayuda hace que Mi Carrerita sea mejor para todos. 🎉

---

**Happy coding! 🚀**
