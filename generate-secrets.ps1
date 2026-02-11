# Script para generar variables de entorno seguras en Windows
# Requiere OpenSSL instalado o puedes generar manualmente

Write-Host "🔐 Generador de Variables de Entorno Seguras" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Función para generar string aleatorio seguro (32 caracteres hex)
function New-RandomString {
    $bytes = New-Object byte[] 32
    $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
    $rng.GetBytes($bytes)
    return ([Convert]::ToHexString($bytes)).ToLower()
}

# Generar JWT_SECRET
$JWT_SECRET = New-RandomString
Write-Host "JWT_SECRET=$JWT_SECRET" -ForegroundColor Green

# Generar JWT_REFRESH_SECRET
$JWT_REFRESH_SECRET = New-RandomString
Write-Host "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Secretos generados. Copia estos valores a tu server/.env" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️ NUNCA compartas estos secretos públicamente" -ForegroundColor Red

# Copiar al portapapeles (opcional)
Write-Host ""
Read-Host "Presiona Enter para copiar JWT_SECRET al portapapeles"
$JWT_SECRET | Set-Clipboard
Write-Host "✓ JWT_SECRET copiado" -ForegroundColor Green
