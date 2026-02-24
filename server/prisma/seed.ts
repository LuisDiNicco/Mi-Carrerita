// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { CorrelativityCondition } from '../src/common/constants/academic-enums';
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
        year: subjectData.year,
        hours: subjectData.hours,
        isOptional: subjectData.isOptional,
      },
    });
  }

  const allSubjects = await prisma.subject.findMany();
  const subjectMap = new Map<string, string>(
    allSubjects.map((s) => [s.planCode, s.id]),
  );

  for (const subjectData of PLAN_2023) {
    const subjectId = subjectMap.get(subjectData.planCode);
    if (!subjectId) continue;

    for (const prereqCode of subjectData.correlatives) {
      const prerequisiteId = subjectMap.get(prereqCode);
      if (prerequisiteId) {
        await prisma.correlativity.upsert({
          where: {
            subjectId_prerequisiteId: { subjectId, prerequisiteId },
          },
          create: {
            subjectId,
            prerequisiteId,
            condition: CorrelativityCondition.REGULAR_CURSADA,
          },
          update: {},
        });
      }
    }
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
