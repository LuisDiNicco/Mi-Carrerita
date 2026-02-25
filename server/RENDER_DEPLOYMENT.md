# 🚀 Guía Rápida de Despliegue en Render

## ✅ Checklist Pre-Despliegue

- [ ] Código pusheado a GitHub
- [ ] Base de datos PostgreSQL creada (Neon recomendado)
- [ ] DATABASE_URL obtenida

## 📝 Configuración en Render Dashboard

### 1. Variables de Entorno (Environment)

```env

DATABASE_URL=postgresql://user:password@host/database
NODE_ENV=production
JWT_SECRET=secreto-super-seguro-aleatorio-minimo-32-caracteres
JWT_REFRESH_SECRET=otro-secreto-super-seguro-aleatorio-diferente
CLIENT_URL=https://tu-frontend-en-render.com
GOOGLE_CLIENT_ID=tu-google-oauth-id (opcional)
GOOGLE_CLIENT_SECRET=tu-google-oauth-secret (opcional)
```

### 2. Build Command

```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

**⚠️ IMPORTANTE:** Usa `npx prisma db push` (NO `migrate deploy`)

### 3. Start Command

```bash
npm run start:prod
```

### 4. Configuración Adicional

- **Root Directory:** `server`
- **Node Version:** 18 o superior (22 recomendado)
- **Auto-Deploy:** Activado (para deploy automático en push a main)

## 🐛 Solución de Problemas Comunes

### ❌ Error: "Cannot find module dist/main"
✅ **Solucionado** - El package.json ya está configurado correctamente con `node dist/main.js`

### ❌ Error: Migraciones SQLite incompatibles
✅ **Solucionado** - El sistema detecta automáticamente PostgreSQL y usa `db push`

### ❌ Base de datos se borra cada 15 minutos
✅ **Solucionado** - Ya no usa SQLite temporal, usa PostgreSQL persistente

### ❌ "Schema already exists" en deploy
✅ **Normal** - `db push` es idempotente, solo aplica cambios nuevos

## 🔄 Workflow de Actualizaciones

1. Haz cambios en tu código local
2. Actualiza **ambos** schemas si modificas la DB:
   - `server/prisma/schema.prisma` (desarrollo/SQLite)
   - `server/prisma/schema.production.prisma` (producción/PostgreSQL)
3. Push a GitHub
4. Render detecta el cambio y redespliega automáticamente

## 🎯 Qué Hace el Sistema Automáticamente

1. Detecta que `DATABASE_URL` contiene "postgres"
2. Copia `schema.production.prisma` sobre `schema.prisma`
3. Genera el cliente de Prisma para PostgreSQL
4. Sincroniza el schema con `db push`
5. Compila el código TypeScript
6. Inicia el servidor en producción

## 📊 Verificar que Todo Funciona

1. Ve a los logs de deploy en Render
2. Busca estos mensajes:
   ```
   📚 Ambiente: PRODUCCIÓN (PostgreSQL)
   🔄 Copiando schema.production.prisma a schema.prisma...
   ✅ Schema de producción configurado
   ```
3. Verifica que el build termina con: `Build successful 🎉`
4. Prueba tu API en: `https://tu-servicio.onrender.com/api`

## 🆘 Soporte

Si algo falla, revisa:
1. Logs de Build en Render
2. Logs de Runtime en Render
3. Que DATABASE_URL sea válida (prueba conectarte con un cliente SQL)
4. Que las variables de entorno estén todas configuradas

## 🔐 Seguridad

- ✅ JWT_SECRET debe ser aleatorio y largo (min 32 caracteres)
- ✅ Nunca commitees archivos `.env` al repositorio
- ✅ Rota tus secretos periódicamente
- ✅ Usa HTTPS siempre (Render lo provee gratis)
