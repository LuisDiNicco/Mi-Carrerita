// Script para configurar el schema correcto según el ambiente
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('postgres');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const sourceSchema = isProduction
  ? path.join(__dirname, 'prisma', 'schema.production.prisma')
  : path.join(__dirname, 'prisma', 'schema.prisma');

console.log(`📚 Ambiente: ${isProduction ? 'PRODUCCIÓN (PostgreSQL)' : 'DESARROLLO (SQLite)'}`);

if (isProduction && fs.existsSync(sourceSchema)) {
  console.log('🔄 Copiando schema.production.prisma a schema.prisma...');
  fs.copyFileSync(sourceSchema, schemaPath);
  console.log('✅ Schema de producción configurado');
} else {
  console.log('✅ Usando schema de desarrollo (SQLite)');
}
