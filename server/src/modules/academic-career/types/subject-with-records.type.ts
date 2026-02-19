import { Prisma } from '@prisma/client';

export type SubjectWithRecords = Prisma.SubjectGetPayload<{
  select: {
    id: true;
    planCode: true;
    name: true;
    year: true;
    hours: true;
    isOptional: true;
    prerequisites: {
      select: {
        condition: true;
        prerequisiteId: true;
        prerequisite: {
          select: { planCode: true };
        };
      };
    };
    records: {
      select: {
        status: true;
        finalGrade: true;
        difficulty: true;
        statusDate: true;
        notes: true;
      };
    };
  };
}>;
