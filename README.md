# 🎓 Mi Carrerita

> Una plataforma interactiva para rastrear, optimizar e visualizar tu carrera universitaria mediante grafos, recomendaciones inteligentes y gamificación.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-ea2845?logo=nestjs)](https://nestjs.com)

---

## ✨ Características

### 📊 Visualización Interactiva
- **Carrera Académica en Grafn** - Visualización de correlatividades pre-requisitos
- **Estado en Tiempo Real** - Colores por estatus (Pendiente, En Curso, Aprobada, etc.)
- **Búsqueda & Filtrado** - Encuentra asignaturas rápidamente
- **Ruta Crítica** - Visualiza el camino más corto a la graduación
- **Fullscreen Mode** - Zoom y pan para explorar tu carrera

### 🎯 Recomendaciones Inteligentes
- **3 Planes Alternativos** - A (rápido), B (equilibrado), C (lento)
- **Basado en Algoritmos** - Cálculo de ruta crítica automático
- **Optimizado para Ti** - Considera prerequisitos y disponibilidad

### 📈 Dashboard & Análisis
- **Estadísticas Completas** - Progreso, promedio, creditos, etc.
- **Gráficos Interactivos** - Pie charts, barras, líneas
- **Proyecciones** - Estimaciones de fecha de graduación

### 🏆 Sistema de Logros
- **Milestones Progresivos** - Desbloquea logros conforme avanzas
- **Tiers (Bronze → Platinum)** - Gamificación motivadora
- **Barra de Progreso Animada** - Visualización del avance

### 🔐 Autenticación
- **Google OAuth 2.0** - Login rápido y seguro
- **JWT + Refresh Tokens** - Tokens seguros con vencimiento
- **Sesión Persistente** - Mantiene tu sesión iniciada
- **Modo Guest** - Explora sin loguear (readonly)

---

## 🚀 Quick Start (5 minutos)

### Requisitos
- Node.js 18+
- npm 8+
- Credenciales de Google OAuth ([obtener aquí](https://console.cloud.google.com/))

### Instalación
```bash
# 1. Configurar variables de entorno
# Editar server/.env y client/.env (ver QUICKSTART.md)

# 2. Instalar dependencias
cd client && npm install
cd ../server && npm install

# 3. Setup base de datos
npx prisma migrate dev
npx prisma db seed

# 4. Iniciar servidores
# Terminal 1:
cd server && npm run start:dev

# Terminal 2:
cd client && npm run dev

# 5. Abrir navegador
# http://localhost:5173
```

👉 **[Ver guía detallada →](QUICKSTART.md)**

---

## 📚 Documentación

| Documento | Descripción |
|-----------|------------|
| **[QUICKSTART.md](QUICKSTART.md)** | Inicio en 5 minutos |
| **[SETUP.md](SETUP.md)** | Guía completa de instalación |
| **[API.md](API.md)** | Documentación de endpoints REST |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Diseño técnico del proyecto |
| **[FAQ.md](FAQ.md)** | Preguntas frecuentes & troubleshooting |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Cómo contribuir |
| **[ROADMAP.md](ROADMAP.md)** | Plan futuro del proyecto |
| **[INDEX.md](INDEX.md)** | Mapa completo de documentación |

---

## 🏗️ Arquitectura

### Cliente (React + TypeScript + Vite)
```
src/
├── app/              # Root component
├── features/         # Módulos principales
│   ├── academic/    # Carrera académica
│   ├── auth/        # Autenticación
│   ├── dashboard/   # Estadísticas
│   ├── landing/     # Landing page
│   ├── recommendations/
│   └── trophies/    # Sistema de logros
└── shared/          # Componentes reutilizables
    ├── components/
    ├── layout/
    ├── ui/
    ├── lib/         # graph.ts, utils.ts
    └── styles/      # Design system
```

### Servidor (NestJS + Prisma)
```
src/
├── modules/         # Módulos principal
│   ├── auth/       # OAuth + JWT
│   └── academic-career/  # Gestión carrera
├── common/          # Utilidades compartidas
├── prisma/          # Base de datos
└── app.module.ts    # Bootstrap
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Zustand** - State management
- **React Flow** - Visualización de grafos
- **Recharts** - Gráficos
- **Tailwind CSS** - Estilos

### Backend
- **NestJS 11** - Framework Node.js
- **Prisma** - ORM type-safe
- **Passport.js** - Autenticación
- **JWT** - Token management
- **SQLite** (dev) / **PostgreSQL** (prod)

---

## 📦 Bases de Datos

### Tablas
- **User** - Información de usuario + Google ID
- **Subject** - Asignaturas del plan de estudio
- **AcademicRecord** - Historial académico
- **Correlativity** - Relaciones de pre-requisitos
- **SubjectReview** - Reseñas de asignaturas

### Seed Data
- 21 asignaturas del plan 2023
- Correlatividades configuradas
- Usuario admin para testing

---

## 🎨 Diseño & UX

- **Tema Retro** - Colores vibrantes e inspiración vintage
- **Responsive** - Desktop, tablet y móvil
- **Accesible** - WCAG 2.1 AA (mejorando)
- **Animaciones Suaves** - Sin exceso pero elegante

---

## 🔐 Seguridad

✅ **Implementado**
- CORS configurado por origen
- JWT con vencimiento (15 minutos)
- Refresh tokens seguros (httpOnly cookies)
- Validación de DTOs
- Type-safe queries

🔒 **Para Producción**
- HTTPS obligatorio
- Rate limiting
- Monitoring & alerting
- Backup automático

---

## 🚀 Deployment

### Frontend
- Vercel / Netlify: Conecta tu repo, auto-deploy en cada push
- Build output: `dist/`

### Backend
- Railway / Heroku: Docker ready
- Database: PostgreSQL en cloud
- Environment: Variables en plataform

Ver detalle en [SETUP.md](SETUP.md#deployment)

---

## 📊 Estado del Proyecto

| Componente | Estatus |
|-----------|---------|
| Frontend base | ✅ MVP Completado |
| Backend base | ✅ MVP Completado |
| Autenticación | ✅ OAuth Google + JWT |
| Visualización | ✅ React Flow + Grafos |
| Recomendaciones | ✅ 3 planes (A/B/C) |
| Dashboard | ✅ Estadísticas completas |
| Logros | ✅ Tiers (Bronze → Platinum) |
| Documentación | ✅ Completa |
| Testing | 🟡 Parcial (30%) |
| Mobile | 🟡 Funcional pero no optimizado |

---

## 🗺️ Roadmap

### v1.1.0 (Q2 2024)
- [ ] Múltiples carreras
- [ ] Personalización de temas
- [ ] Exportar/Importar datos
- [ ] Notificaciones

### v1.2.0 (Q3 2024)
- [ ] Grupos de estudio
- [ ] Compartir carrera
- [ ] Comentarios en asignaturas
- [ ] Leaderboards

### v1.3.0 (Q4 2024)
- [ ] Recomendaciones con IA
- [ ] Chatbot asistente
- [ ] Análisis predictivo

Ver [ROADMAP.md](ROADMAP.md) máss detalle.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tu código (`git commit -m 'feat: agregar algo'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

---

## ❓ FAQ

**¿Necesito cuenta de Google para usar?**  
No, hay modo guest para explorar.

**¿Es código abierto?**  
Sí, bajo licencia MIT.

**¿Puedo modificar para mi universidad?**  
Sí, es fácil agregar nuevas carreras. Ver [FAQ.md](FAQ.md#how-do-i-add-a-new-subject).

**¿Cómo se almacenan mis datos?**  
En tu propia instancia de base de datos (por defecto SQLite o PostgreSQL).

Ver más en [FAQ.md](FAQ.md).

---

## 🐛 Report a Bug

Encontraste un error? 
1. Revisa [FAQ.md](FAQ.md) primero
2. Abre un [Issue](https://github.com/usuario/Mi-Carrerita/issues)
3. Incluye: pasos para reproducir, capturas, entorno

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más.

---

## 👤 Autor

Creado con ❤️ para estudiantes universitarios que quieren dominar su carrera.

---

## 🙏 Agradecimientos

- [NestJS](https://nestjs.com) - Framework backend
- [React](https://react.dev) - Framework frontend
- [Prisma](https://www.prisma.io) - ORM moderno
- [React Flow](https://reactflow.dev) - Visualización de grafos
- El equipo de open source de otros proyectos

---

## 📞 Soporte

- **Documentación:** [INDEX.md](INDEX.md) - Mapa completo
- **Problemas:** [FAQ.md](FAQ.md) - Troubleshooting
- **Preguntas:** [Discussions](https://github.com) - GitHub Discussions
- **Bugs:** [Issues](https://github.com) - GitHub Issues

---

## 🎯 Próximos Pasos

1. **Empezar:** [QUICKSTART.md](QUICKSTART.md)
2. **Entender:** [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Desarrollar:** Abre `client` y `server` en tu IDE
4. **Contribuir:** Lee [CONTRIBUTING.md](CONTRIBUTING.md)

---

**¡Que disfrutes optimizando tu carrera universitaria con Mi Carrerita! 🚀🎓**

---

`Última actualización: Enero 2024 | Versión: 1.0.0 | Estado: MVP Completado ✅`
