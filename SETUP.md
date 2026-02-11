# Mi Carrerita - Setup Guide

Una plataforma integral para rastrear y optimizar tu carrera universitaria usando algoritmos de grafos y visualización interactiva.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ y npm
- Credenciales de Google OAuth (para autenticación)

### 1. Configuración del Servidor

El servidor está pre-configurado. Solo necesitas actualizar las variables de entorno OAuth:

**Archivo: `server/.env`**

```env
# Base de Datos (SQLite ya está configurado)
DATABASE_URL="file:./dev.db"

# URL del Cliente
CLIENT_URL="http://localhost:5173"

# Google OAuth (obtén estas de Google Cloud Console)
GOOGLE_CLIENT_ID="tu-client-id-aqui"
GOOGLE_CLIENT_SECRET="tu-client-secret-aqui"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# JWT Secrets (ya generados, cambiar en producción)
JWT_SECRET="your-secret-key-change-me-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-me-in-production"
```

**Para obtener las credenciales de Google:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0 (tipo: aplicación web)
5. Autoriza las URIs:
   - Orígenes autorizados: `http://localhost:3000`
   - URIs de redirección autorizados: `http://localhost:3000/auth/google/callback`
6. Copia el Client ID y Client Secret al `.env`

### 2. Configuración del Cliente

**Archivo: `client/.env`**

```env
# API del servidor
VITE_API_URL=http://localhost:3000

# Google OAuth Client ID (mismo que en el servidor)
VITE_GOOGLE_CLIENT_ID="tu-client-id-aqui"
```

### 3. Instalar Dependencias

```bash
# Servidor (ya instalado)
cd server
npm install

# Cliente (ya instalado)
cd ../client
npm install
```

### 4. Inicializar Base de Datos

```bash
# Desde la carpeta del servidor
cd server
npx prisma migrate dev --name init  # Si es la primera vez
npx prisma db seed                   # Cargar datos de prueba
```

**Usuario Admin Creado:**
- Email: `user@admin`
- Propósito: Pruebas y desarrollo

### 5. Ejecutar Servidores

**Terminal 1 - Servidor NestJS (puerto 3000):**

```bash
cd server
npm run start:dev
```

**Terminal 2 - Cliente Vite (puerto 5173):**

```bash
cd client
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 📁 Estructura del Proyecto

```
Mi Carrerita/
├── client/                          # Frontend React + TypeScript
│   ├── src/
│   │   ├── app/                     # Componente raíz
│   │   ├── features/                # Módulos de funcionalidad
│   │   │   ├── academic/           # Grafo de carrera, historial
│   │   │   ├── auth/               # Autenticación OAuth + JWT
│   │   │   ├── dashboard/          # Estadísticas y gráficos
│   │   │   ├── landing/            # Página de bienvenida
│   │   │   ├── recommendations/    # Motor de recomendaciones
│   │   │   └── trophies/           # Sistema de logros
│   │   └── shared/                 # Componentes y utilitarios reutilizables
│   │       ├── components/
│   │       ├── lib/               # Funciones helper (graph.ts, utils.ts)
│   │       ├── layout/            # AppHeader, SideNav
│   │       ├── styles/            # Design system retro
│   │       └── types/             # Tipos TypeScript compartidos
│   └── vite.config.ts              # Configuración de Vite
│
├── server/                          # Backend NestJS + Prisma
│   ├── src/
│   │   ├── modules/                 # Módulos NestJS
│   │   │   ├── academic-career/
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   └── dto/
│   │   │   └── auth/
│   │   │       ├── controllers/
│   │   │       ├── services/
│   │   │       ├── strategies/
│   │   │       │   ├── google.strategy.ts
│   │   │       │   └── jwt.strategy.ts
│   │   │       └── guards/
│   │   ├── common/                  # Constantes, enums
│   │   ├── prisma/                  # Servicio de base de datos
│   │   └── main.ts                  # Punto de entrada
│   ├── prisma/
│   │   ├── schema.prisma            # Esquema de base de datos
│   │   └── seed.ts                  # Script de inicialización de datos
│   └── nest-cli.json
│
├── docker-compose.yml               # PostgreSQL (para producción eventual)
└── .env                             # Variables globales
```

---

## 🎯 Características Principales

### 1. **Grafo de Carrera Interactivo**
- Visualización de asignaturas con React Flow
- Colores por estado (Pendiente, Disponible, En Curso, etc.)
- Búsqueda y filtrado
- Ruta crítica en tiempo real
- Modo fullscreen

### 2. **Historial Académico**
- Tabla de registros académicos
- Agregar nuevos registros
- Editar notas, calificaciones, dificultad
- Filtrado por estado

### 3. **Dashboard**
- Gráficos de progreso (pie, barras, líneas)
- Estadísticas generales
- Proyecciones de finalización

### 4. **Motor de Recomendaciones**
- 3 planes alternativos (A, B, C)
- Basado en algoritmos de grafos
- Cálculo de ruta crítica
- Sugerencias inteligentes de orden de estudio

### 5. **Sistema de Logros (Trophies)**
- Milestones de progreso
- Tiers: Bronze, Silver, Gold, Platinum
- Visualización animada

### 6. **Autenticación**
- Google OAuth 2.0
- JWT access tokens (15 minutos)
- Refresh tokens (7 días, almacenados como httpOnly cookies)
- Opción de guest para explorar

---

## 🔑 Configuración de Entorno

### Variables del Servidor

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión SQLite | `file:./dev.db` |
| `CLIENT_URL` | URL del cliente | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | OAuth ID de Google | Desde Google Cloud |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret de Google | Desde Google Cloud |
| `GOOGLE_CALLBACK_URL` | URL de callback OAuth | `http://localhost:3000/auth/google/callback` |
| `JWT_SECRET` | Secreto JWT | Generar con `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Secreto Refresh Token | Generar con `openssl rand -hex 32` |

### Variables del Cliente

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del servidor API | `http://localhost:3000` |
| `VITE_GOOGLE_CLIENT_ID` | OAuth ID de Google | Mismo del servidor |

---

## 🛠️ Comandos Útiles

### Servidor

```bash
cd server

# Desarrollo con hot reload
npm run start:dev

# Producción
npm run build
npm run start:prod

# Linting
npm run lint

# Testing
npm run test
npm run test:e2e

# Base de datos
npx prisma studio       # UI para ver base de datos
npx prisma migrate dev  # Crear migración
npx prisma db seed      # Ejecutar seed
```

### Cliente

```bash
cd client

# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## 🔐 Seguridad en Desarrollo

⚠️ **IMPORTANTE:**
- Los secretos JWT en `server/.env` son placeholders para desarrollo
- En producción, **DEBES**:
  1. Generar secretos criptográficamente seguros:
     ```bash
     openssl rand -hex 32  # para JWT_SECRET
     openssl rand -hex 32  # para JWT_REFRESH_SECRET
     ```
  2. Usar variables de entorno desde tu proveedor cloud (Never.io, AWS Secrets, etc.)
  3. Cambiar `GOOGLE_CALLBACK_URL` a tu dominio de producción
  4. Cambiar `CLIENT_URL` a tu dominio de producción

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED 127.0.0.1:3000"
- El servidor no está corriendo
- Ejecuta `npm run start:dev` en la carpeta `server/`

### Error: "GOOGLE_CLIENT_ID is not configured"
- Falta configurar las credenciales de Google OAuth
- Consulta la sección "Configuración del Servidor" arriba

### Errores de Prisma
```bash
# Regenerar cliente Prisma
cd server
npx prisma generate

# Resetear base de datos (⚠️ pierde datos)
npx prisma db push --force-reset
```

### TypeScript errors en el IDE
```bash
# Recargar workspace de VS Code
# Ctrl+Shift+P → "Developer: Reload Window"
```

---

## 📚 Stack Tecnológico

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool (3-4x más rápido que Webpack)
- **Zustand** - Estado global simple
- **React Flow** - Visualización de grafos
- **Recharts** - Gráficos
- **Tailwind CSS** - Estilos (tema retro)
- **Axios** - HTTP client

### Backend
- **NestJS 11** - Framework Node.js
- **Prisma** - ORM + type-safe queries
- **Passport.js** - Autenticación
- **JWT** - Token management
- **SQLite** - Base de datos (dev)
- **PostgreSQL** - Base de datos (producción)

---

## 🚢 Deployment

### A Railway / Vercel

**Servidor:**
```bash
# Build
npm run build

# Environment variables necesarios en plataforma:
# - DATABASE_URL (PostgreSQL)
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - JWT_SECRET (generar nuevo)
# - JWT_REFRESH_SECRET (generar nuevo)
```

**Cliente:**
```bash
# Build automático en Vercel/Netlify
# Solo necesita VITE_API_URL apuntando al servidor en producción
```

---

## 📝 Licencia

Proyecto universitario - Uso académico.

---

## 🤝 Contribución

Este es un proyecto personal. Para mejoras, fork el repo y envía un PR.

---

## 📧 Soporte

Para problemas o preguntas, abre un Issue en el repositorio.

---

**¡Optimiza tu carrera universitaria con Mi Carrerita! 🎓**
