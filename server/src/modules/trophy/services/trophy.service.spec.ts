import { Test, TestingModule } from '@nestjs/testing';
import { TrophyService } from '../../../modules/trophy/services/trophy.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import { TrophyTier } from '../../../common/constants/trophy-enums';

describe('TrophyService', () => {
  let service: TrophyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    trophy: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userTrophy: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    academicRecord: {
      findMany: jest.fn(),
    },
    subject: {
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrophyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Logger, useValue: mockLogger },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<TrophyService>(TrophyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndUnlockTrophies', () => {
    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.checkAndUnlockTrophies('test@test.com'),
      ).rejects.toThrow('Usuario no encontrado.');
    });

    it('debería desbloquear el trofeo FIRST_SUBJECT_COMPLETED si se aprueba la primera materia', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });

      const mockTrophies = [
        {
          id: 't-1',
          code: 'FIRST_SUBJECT_COMPLETED',
          name: 'Primer Pasito',
          tier: TrophyTier.BRONZE,
        },
      ];
      const mockUserTrophies: any[] = []; // Ninguno desbloqueado aún

      // Mock $transaction retornando los arreglos
      let txCount = 0;
      mockPrismaService.$transaction.mockImplementation((promises) => {
        txCount++;
        if (txCount === 1) {
          // First is trophy.findMany, Second is userTrophy.findMany
          return Promise.resolve([mockTrophies, mockUserTrophies]);
        }
        // If it's the buildEvaluationContext transaction
        return Promise.resolve([
          [
            {
              status: SubjectStatus.APROBADA,
              finalGrade: 80,
              subject: { hours: 64, year: 1, isOptional: false },
            },
          ], // records
          { _count: { id: 40 }, _sum: { hours: 2600 } }, // stats
        ]);
      });

      mockPrismaService.userTrophy.upsert.mockResolvedValue({});

      const result = await service.checkAndUnlockTrophies('test@test.com');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('FIRST_SUBJECT_COMPLETED');
      expect(mockPrismaService.userTrophy.upsert).toHaveBeenCalledTimes(1);
    });

    it('no debería re-desbloquear un trofeo ya desbloqueado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });

      const mockTrophies = [
        { id: 't-1', code: 'FIRST_SUBJECT_COMPLETED', name: 'Primer Pasito' },
      ];
      const mockUserTrophies = [{ trophyId: 't-1', unlockedAt: new Date() }];

      // Mock $transaction
      let txCount = 0;
      mockPrismaService.$transaction.mockImplementation((promises) => {
        txCount++;
        if (txCount === 1) {
          return Promise.resolve([mockTrophies, mockUserTrophies]);
        }
        return Promise.resolve([
          [
            {
              status: SubjectStatus.APROBADA,
              finalGrade: 80,
              subject: { hours: 64, year: 1, isOptional: false },
            },
          ],
          { _count: { id: 40 }, _sum: { hours: 2600 } },
        ]);
      });

      const result = await service.checkAndUnlockTrophies('test@test.com');

      expect(result).toHaveLength(0); // Ninguno nuevo
      expect(mockPrismaService.userTrophy.upsert).not.toHaveBeenCalled();
    });
  });

  describe('Efficiency and Resource Checks', () => {
    it('debería procesar grandes volúmenes de materias (10.000 records ficticios) sin memory limit excedido e iterador', async () => {
      const startMem = process.memoryUsage().heapUsed;
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });

      const mockTrophies = [{ id: 't-1', code: 'LEGEND' }];
      const mockUserTrophies: any[] = [];

      // Crear 10.000 records
      const massiveRecords = Array.from({ length: 10000 }, (_, i) => ({
        status: SubjectStatus.APROBADA,
        finalGrade: 95,
        subject: { hours: 64, year: 1, isOptional: false },
      }));

      let txCount = 0;
      mockPrismaService.$transaction.mockImplementation((promises) => {
        txCount++;
        if (txCount === 1) {
          return Promise.resolve([mockTrophies, mockUserTrophies]);
        }
        return Promise.resolve([
          massiveRecords,
          { _count: { id: 10000 }, _sum: { hours: 640000 } },
        ]);
      });

      mockPrismaService.userTrophy.upsert.mockResolvedValue({});

      const startTime = Date.now();
      const result = await service.checkAndUnlockTrophies('test@test.com');
      const endTime = Date.now();

      expect(result).toHaveLength(1); // LEGEND unlocked
      expect(endTime - startTime).toBeLessThan(1500); // Exige menos de 1.5s

      const endMem = process.memoryUsage().heapUsed;
      const diffMb = (endMem - startMem) / 1024 / 1024;
      expect(diffMb).toBeLessThan(50); // No debería haber una fuga masiva al iterar (>50mb)
    });
  });
});
