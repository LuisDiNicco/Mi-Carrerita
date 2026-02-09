import { PrismaClient } from '@prisma/client';
import { PLAN_2023 } from '../src/data/plan-2023'; // Asegurate que esta ruta sea correcta

const prisma = new PrismaClient();

// Definimos constantes para evitar "Magic Strings" y errores de tipeo
const CONDITION = {
  REGULAR: 'REGULAR_CURSADA',
  FINAL: 'FINAL_APROBADO',
} as const;

async function main() {
  console.log('🌱 INICIO DEL SEEDING (Modo Calidad)...');

  // --- 1. GESTIÓN DE USUARIO ADMIN ---
  // Usamos upsert para que si ya existe, no tire error.
  const user = await prisma.user.upsert({
    where: { email: 'admin@micarrerita.com' },
    update: {}, // Si existe, no cambiamos nada
    create: {
      email: 'admin@micarrerita.com',
      name: 'Admin User',
      avatarUrl: 'https://github.com/shadcn.png',
    },
  });
  console.log(`👤 Usuario Admin verificado: ${user.email}`);

  // --- 2. CARGA DE MATERIAS (Nodos) ---
  console.log(`📚 Sincronizando ${PLAN_2023.length} materias del Plan 2023...`);
  
  // Usamos un bucle for...of para poder usar await adentro tranquilamente
  for (const subjectData of PLAN_2023) {
    await prisma.subject.upsert({
      where: { planCode: subjectData.planCode },
      update: {
        // Actualizamos datos por si corregimos algún nombre o crédito en el archivo
        name: subjectData.name,
        semester: subjectData.semester,
        credits: subjectData.credits,
        isOptional: subjectData.isOptional,
      },
      create: {
        planCode: subjectData.planCode,
        name: subjectData.name,
        semester: subjectData.semester,
        credits: subjectData.credits,
        isOptional: subjectData.isOptional,
      },
    });
  }
  console.log('✅ Materias sincronizadas.');

  // --- 3. CARGA DE CORRELATIVIDADES (Aristas) ---
  console.log('🔗 Tejiendo red de correlatividades...');

  // Contador para logs
  let relationsCreated = 0;

  for (const subjectData of PLAN_2023) {
    // 1. Buscamos la materia "Hija" (la que tiene los requisitos) en la BD para tener su ID real
    const subjectInDb = await prisma.subject.findUnique({
      where: { planCode: subjectData.planCode },
    });

    if (!subjectInDb) continue; // No debería pasar, pero por seguridad

    // Función helper para procesar listas de códigos
    const processRequirements = async (
      codes: string[], 
      conditionType: string
    ) => {
      for (const reqCode of codes) {
        // 2. Buscamos la materia "Padre" (el requisito)
        const requirementInDb = await prisma.subject.findUnique({
          where: { planCode: reqCode },
        });

        if (!requirementInDb) {
          console.warn(`⚠️ ALERTA: La materia ${subjectData.name} pide ${reqCode}, pero esa materia no existe en el plan.`);
          continue;
        }

        // 3. Creamos o actualizamos la relación
        // La clave compuesta es subjectId + prerequisiteId
        await prisma.correlativity.upsert({
          where: {
            subjectId_prerequisiteId: {
              subjectId: subjectInDb.id,
              prerequisiteId: requirementInDb.id,
            },
          },
          update: {
            condition: conditionType, // Actualizamos la condición si cambió (ej: de Regular a Final)
          },
          create: {
            subjectId: subjectInDb.id,
            prerequisiteId: requirementInDb.id,
            condition: conditionType,
          },
        });
        relationsCreated++;
      }
    };

    // Procesamos correlativas de FINAL
    await processRequirements(subjectData.correlativesFinal, CONDITION.FINAL);

    // Procesamos correlativas de REGULAR
    await processRequirements(subjectData.correlativesRegular, CONDITION.REGULAR);
  }

  console.log(`✅ Relaciones procesadas. Total de enlaces: ${relationsCreated}`);
  console.log('🚀 SEEDING FINALIZADO CON ÉXITO.');
}

main()
  .catch((e) => {
    console.error('❌ Error fatal durante el seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });