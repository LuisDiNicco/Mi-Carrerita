# Configuración de Base de Datos - Dual SQLite/PostgreSQL

Este proyecto está configurado para usar **SQLite en desarrollo local** y **PostgreSQL en producción (Render)** sin necesidad de Docker local.

## 🔧 Cómo Funciona

El sistema detecta automáticamente el ambiente y usa la base de datos correcta:

- **Desarrollo Local**: SQLite (`prisma/dev.db`)
- **Producción (Render)**: PostgreSQL (Neon u otro proveedor)

### Detección Automática

El script `setup-schema.js` detecta el ambiente basándose en:
1. La variable `NODE_ENV=production`
2. Si `DATABASE_URL` contiene "postgres"

Si detecta producción, copia `schema.production.prisma` (PostgreSQL) sobre `schema.prisma` antes de generar el cliente de Prisma.

## 📁 Archivos Clave

```
server/
├── prisma/
│   ├── schema.prisma              # Schema para desarrollo (SQLite)
│   ├── schema.production.prisma   # Schema para producción (PostgreSQL)
│   ├── dev.db                     # Base de datos SQLite local
│   └── migrations/                # Migraciones de SQLite (solo desarrollo)
├── setup-schema.js                # Script de detección de ambiente
└── .env                           # Variables de entorno locales
```

## 🚀 Configuración Local (SQLite)

1. **No necesitas configurar nada especial**. Por defecto usa SQLite.

2. Si tienes un archivo `.env`, asegúrate de que `DATABASE_URL` esté comentado o apunte a SQLite:
   ```env
   # DATABASE_URL="file:./dev.db"  # Opcional, es el default
   ```

3. Ejecuta las migraciones (solo primera vez):
   ```bash
   cd server
   npx prisma migrate dev
   ```

4. Inicia el servidor:
   ```bash
   npm run start:dev
   ```

## 🌐 Configuración en Render (PostgreSQL)

### Paso 1: Configurar Variables de Entorno en Render

En el dashboard de Render, configura estas variables:

```env
NODE_ENV=production
DATABASE_URL=tu-url-de-postgresql-desde-neon
JWT_SECRET=tu-secreto-jwt
JWT_REFRESH_SECRET=tu-refresh-secret
CLIENT_URL=https://tu-frontend.com
```

### Paso 2: Configurar Build Command en Render

Usa este comando de build (IMPORTANTE: usa `db push` en lugar de `migrate deploy`):

```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

**¿Por qué `db push` en lugar de `migrate deploy`?**

- Las migraciones en `prisma/migrations/` son de SQLite y no son compatibles con PostgreSQL
- `db push` sincroniza directamente el schema con la base de datos sin usar migraciones
- Es perfecto para el primer despliegue

### Paso 3: Configurar Start Command en Render

```bash
npm run start:prod
```

## 🔄 Flujo de Desarrollo

### Agregando un Nuevo Modelo

1. Edita `prisma/schema.prisma` (SQLite)
2. Crea la migración local:
   ```bash
   npx prisma migrate dev --name nombre_de_migracion
   ```
3. **También actualiza** `prisma/schema.production.prisma` con los mismos cambios
4. Haz commit de ambos archivos
5. Render automáticamente detectará y aplicará los cambios con `db push`

### Ver la Base de Datos

**Local (SQLite):**
```bash
npx prisma studio
```

**Producción (PostgreSQL):**
- Usa el dashboard de Neon o tu proveedor de PostgreSQL
- O configura DATABASE_URL temporal en `.env` y ejecuta `prisma studio`

## 🐛 Troubleshooting

### Error: "Cannot find module dist/main"
✅ **Solucionado**: Actualizado `start:prod` a `node dist/main.js`

### Error de Migraciones en Render
✅ **Solucionado**: Usando `db push` en lugar de `migrate deploy`

### Cambios no se reflejan en producción
1. Verifica que actualizaste ambos schemas (development y production)
2. Fuerza un nuevo deploy en Render (Manual Deploy)
3. Revisa los logs de build en Render

### "Schema already exists" en PostgreSQL
- Esto es normal, `db push` es idempotente
- Solo aplicará cambios incrementales

## 📊 Diferencias entre SQLite y PostgreSQL

Ambos schemas son idénticos excepto por el `datasource`:

**SQLite (desarrollo):**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**PostgreSQL (producción):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## ⚠️ Importante

- **NUNCA** commitees tu archivo `.env` al repositorio
- En producción, usa secretos fuertes para JWT
- PostgreSQL en producción es persistente (no se borra como SQLite temporal)
- Las migraciones de SQLite son solo para desarrollo local

## 🔐 Seguridad

En producción, asegúrate de:
- Usar HTTPS
- Configurar CORS correctamente
- Usar secretos seguros para JWT
- Mantener tus credenciales de DB seguras en variables de entorno
