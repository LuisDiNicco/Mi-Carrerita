// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seeding...');

  // 1. Crear Usuario Dev (Vos)
  const user = await prisma.user.upsert({
    where: { email: 'admin@micarrerita.com' },
    update: {},
    create: {
      email: 'admin@micarrerita.com',
      name: 'Admin User',
      avatarUrl: 'https://github.com/shadcn.png',
    },
  });
  console.log(`👤 Usuario creado: ${user.name}`);

  // 2. Definir Materias (Basado en tu CSV "Materias '23")
  // NOTA: Solo puse las del 1er Cuatri y sus correlativas para probar.
  // Luego completamos las 63.
  const subjectsData = [
    // Primer Cuatrimestre (Sin correlativas)
    { planCode: '3621', name: 'Matemática Discreta', semester: 1, credits: 4 },
    { planCode: '3622', name: 'Análisis Matemático 1', semester: 1, credits: 4 },
    { planCode: '3623', name: 'Programación Inicial', semester: 1, credits: 4 },
    { planCode: '3624', name: 'Intro. a los Sist. de Información', semester: 1, credits: 4 },
    { planCode: '3625', name: 'Sistemas de Numeración', semester: 1, credits: 4 },
    { planCode: '3626', name: 'Principios de Calidad de Sw', semester: 1, credits: 4 },
    
    // Segundo Cuatrimestre (Ejemplos con correlativas)
    { planCode: '3627', name: 'Álgebra y Geometría Analítica 1', semester: 2, credits: 4 },
    { planCode: '3628', name: 'Física 1', semester: 2, credits: 4 },
    { planCode: '3629', name: 'Programación Estructurada', semester: 2, credits: 4 },
  ];

  console.log('📚 Cargando materias...');
  for (const subject of subjectsData) {
    await prisma.subject.upsert({
      where: { planCode: subject.planCode },
      update: {},
      create: {
        planCode: subject.planCode,
        name: subject.name,
        semester: subject.semester,
        credits: subject.credits,
      },
    });
  }

// 3. Crear Correlatividades (MODIFICADO PARA SQLITE)
  console.log('🔗 Tejiendo correlatividades...');
  
  const progInicial = await prisma.subject.findUnique({ where: { planCode: '3623' } });
  const progEstructurada = await prisma.subject.findUnique({ where: { planCode: '3629' } });

  if (progInicial && progEstructurada) {
    // Definimos la relación que queremos crear
    const relation = {
      subjectId: progEstructurada.id,      // La materia nueva
      prerequisiteId: progInicial.id,      // La previa necesaria
      condition: 'REGULAR_CURSADA',        // Condición
    };

    // Usamos 'upsert' (Insertar o Actualizar) para evitar errores si ya existe
    await prisma.correlativity.upsert({
      where: {
        subjectId_prerequisiteId: { // Clave compuesta única
          subjectId: relation.subjectId,
          prerequisiteId: relation.prerequisiteId,
        }
      },
      update: {}, // Si existe, no hacemos nada
      create: relation, // Si no existe, la creamos
    });
  }

  console.log('✅ Seeding finalizado correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });