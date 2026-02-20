import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Logger, NotFoundException } from '@nestjs/common';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import { AcademicRecordWithSubject } from '../../../shared/types/database.types';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    academicRecord: { findMany: jest.fn() },
  };

  const mockLogger = { log: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('debería lanzar NotFound si no se encuentra el usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getDashboardData('t@t.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería calcular todos los charts correctamente usando los helpers con data variada', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });

      const records = [
        // Semestre 1-1
        {
          status: SubjectStatus.APROBADA,
          finalGrade: 90,
          difficulty: 4,
          statusDate: new Date('2022-06-01'),
          subject: { year: 1, semester: 1, hours: 64, isOptional: false },
        },
        {
          status: SubjectStatus.APROBADA,
          finalGrade: 80,
          difficulty: 6,
          statusDate: new Date('2022-07-01'),
          subject: { year: 1, semester: 1, hours: 64, isOptional: false },
        },
        // Semestre 1-2
        {
          status: SubjectStatus.PENDIENTE,
          finalGrade: null,
          difficulty: 9,
          statusDate: new Date('2022-12-01'),
          subject: { year: 1, semester: 2, hours: 64, isOptional: false },
        },
        // Semestre 2-1
        {
          status: SubjectStatus.REGULARIZADA,
          finalGrade: null,
          difficulty: 7,
          statusDate: new Date('2023-06-01'),
          subject: { year: 2, semester: 1, hours: 64, isOptional: true },
        },
      ] as any;

      mockPrismaService.academicRecord.findMany.mockResolvedValue(records);

      const result = await service.getDashboardData('t@t.com');

      expect(result).toBeDefined();
      expect(result.summary.totalSubjects).toBe(4);
      expect(result.summary.completedSubjects).toBe(3); // Las aprobadas y regularizadas
      expect(result.summary.overallAverageGrade).toBe(85); // (90+80)/2
      expect(result.summary.currentStreak).toBe(undefined); // El último semestre no tiene > 80, por lo que undefined.

      // Performance chart should have 3 data points
      expect(result.performanceChart.data.length).toBe(3);
    });

    it('debería formatear correctamente un historial vacío', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findMany.mockResolvedValue([]);

      const result = await service.getDashboardData('t@t.com');

      expect(result.summary.totalSubjects).toBe(0);
      expect(result.summary.completionPercentage).toBe(0);
      expect(result.performanceChart.data.length).toBe(0);
    });

    it('debería detectar rachas de promedios excelentes', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });

      const records = [
        // Semestre 1-1 (promedio 90)
        {
          status: SubjectStatus.APROBADA,
          finalGrade: 90,
          difficulty: 4,
          statusDate: new Date('2022-06-01'),
          subject: { year: 1, semester: 1, hours: 64 },
        },
        // Semestre 1-2 (promedio 85)
        {
          status: SubjectStatus.APROBADA,
          finalGrade: 85,
          difficulty: 6,
          statusDate: new Date('2022-12-01'),
          subject: { year: 1, semester: 2, hours: 64 },
        },
      ] as any;

      mockPrismaService.academicRecord.findMany.mockResolvedValue(records);

      const result = await service.getDashboardData('t@t.com');

      expect(result.summary.currentStreak).toBe(2);
    });
  });
});
