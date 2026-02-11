# 🚀 Quick Start - Mi Carrerita

## 1️⃣ Configurar Google OAuth

Necesitas credenciales de Google para la autenticación:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea nuevo proyecto → Habilita "Google+ API"
3. Vete a Credenciales → Crear OAuth 2.0 (aplicación web)
4. Autoriza:
   - Orígenes: `http://localhost:3000`
   - Redirecciones: `http://localhost:3000/auth/google/callback`
5. Copia el **Client ID** y **Client Secret**

## 2️⃣ Actualizar Variables de Entorno

**`server/.env`:**
```env
GOOGLE_CLIENT_ID=tu-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
```

**`client/.env`:**
```env
VITE_GOOGLE_CLIENT_ID=tu-client-id-aqui
```

## 3️⃣ Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd server
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## 4️⃣ Abrir Navegador

Abre [http://localhost:5173](http://localhost:5173)

---

## 📦 Datos de Prueba

- Usuario Admin: `user@admin`
- Base de Datos: SQLite en `server/dev.db`
- 21 asignaturas precargadas del plan de 2023

---

## 🔑 Generar Secretos JWT (Producción)

**Windows:**
```powershell
.\generate-secrets.ps1
```

**Linux/Mac:**
```bash
bash generate-secrets.sh
```

---

## 🛠️ Troubleshooting Rápido

| Error | Solución |
|-------|----------|
| "GOOGLE_CLIENT_ID not configured" | Actualizar `.env` con credenciales reales |
| "Cannot find module" | `npm install` en server/ y client/ |
| "Failed to connect to server" | Asegúrate que `npm run start:dev` esté corriendo en server/ |
| "EADDRINUSE 3000" | Puerto 3000 está en uso, mata el proceso o cambia el puerto |

---

Ver **[SETUP.md](SETUP.md)** para documentación completa.
