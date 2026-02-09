// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
// IMPORTAMOS DESDE NUESTRO ARCHIVO MANUAL
import { SubjectStatus, CorrelativityCondition } from '../src/common/constants/academic-enums';
import { PLAN_2023 } from '../src/data/plan-2023';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed...');

  const email = 'admin@micarrerita.com';
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      googleId: 'admin-google-id',
    },
  });
  console.log(`👤 Usuario admin: ${admin.id}`);

  for (const subjectData of PLAN_2023) {
    await prisma.subject.upsert({
      where: { planCode: subjectData.planCode },
      update: {},
      create: {
        planCode: subjectData.planCode,
        name: subjectData.name,
        semester: subjectData.semester,
        credits: subjectData.credits,
        isOptional: subjectData.isOptional,
      },
    });
  }

  const allSubjects = await prisma.subject.findMany();
  const subjectMap = new Map<string, string>(
    allSubjects.map((s) => [s.planCode, s.id])
  );

  for (const subjectData of PLAN_2023) {
    const subjectId = subjectMap.get(subjectData.planCode);
    if (!subjectId) continue;

    for (const prereqCode of subjectData.correlativesFinal) {
      const prerequisiteId = subjectMap.get(prereqCode);
      if (prerequisiteId) {
        await prisma.correlativity.upsert({
            where: {
                subjectId_prerequisiteId: { subjectId, prerequisiteId }
            },
            create: {
                subjectId,
                prerequisiteId,
                condition: CorrelativityCondition.FINAL_APROBADO // Usamos el Enum TS
            },
            update: {}
        });
      }
    }

    for (const prereqCode of subjectData.correlativesRegular) {
      const prerequisiteId = subjectMap.get(prereqCode);
      if (prerequisiteId) {
        await prisma.correlativity.upsert({
            where: {
                subjectId_prerequisiteId: { subjectId, prerequisiteId }
            },
            create: {
                subjectId,
                prerequisiteId,
                condition: CorrelativityCondition.REGULAR_CURSADA // Usamos el Enum TS
            },
            update: {}
        });
      }
    }
  }

  // Historial de prueba
  const discreta = allSubjects.find((s) => s.planCode === '3621');
  if (discreta) {
    await prisma.academicRecord.upsert({
      where: {
        userId_subjectId: { userId: admin.id, subjectId: discreta.id },
      },
      create: {
        userId: admin.id,
        subjectId: discreta.id,
        status: SubjectStatus.APROBADA, // Usamos el Enum TS
        finalGrade: 9,
      },
      update: {},
    });
  }
  console.log('✅ Seed finalizado correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });