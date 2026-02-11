#!/bin/bash
# Script para generar variables de entorno seguras

echo "🔐 Generador de Variables de Entorno Seguras"
echo "============================================="
echo ""

# Generar JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generar JWT_REFRESH_SECRET
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"

echo ""
echo "✅ Secretos generados. Cópia estos valores a tu server/.env"
echo ""
echo "⚠️ NUNCA compartas estos secretos públicamente"
