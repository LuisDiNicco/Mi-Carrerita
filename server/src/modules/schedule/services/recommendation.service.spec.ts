import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import { TimePeriod } from '../../../common/constants/schedule-enums';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    academicRecord: { findMany: jest.fn() },
    subject: { findMany: jest.fn(), findUnique: jest.fn() },
    timetable: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    recommendedSubject: { findMany: jest.fn(), upsert: jest.fn() },
  };

  const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRecommendation', () => {
    it('debería lanzar NotFound si no se encuenta el usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.generateRecommendation('test@test.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería retornar las recomendaciones ignorando las materias que el usuario ya aprobó', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      // Materia M1 ya aprobada
      mockPrismaService.academicRecord.findMany.mockResolvedValue([
        { subjectId: 's1', status: SubjectStatus.APROBADA },
      ]);
      // Todas las materias
      mockPrismaService.subject.findMany.mockResolvedValue([
        {
          id: 's1',
          name: 'Mate 1',
          planCode: 'M1',
          year: 1,
          hours: 96,
          prerequisites: [],
        },
        {
          id: 's2',
          name: 'Fisica 1',
          planCode: 'F1',
          year: 1,
          hours: 96,
          prerequisites: [],
        },
      ]);
      mockPrismaService.timetable.findMany.mockResolvedValue([]);
      mockPrismaService.recommendedSubject.findMany.mockResolvedValue([]);

      const result = await service.generateRecommendation('test@test.com');

      expect(result.recommendedSubjects).toHaveLength(1);
      expect(result.recommendedSubjects[0].subjectId).toBe('s2'); // Fisica 1
      expect(result.recommendedSubjects[0].status).toBe('SUGGESTED');
      expect(result.hasConflicts).toBe(false);
    });

    it('debería mapear conflictos si hay recs MANTENIDA que chocan con otros horarios MANTENIDA', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findMany.mockResolvedValue([]); // Nada aprobado
      mockPrismaService.subject.findMany.mockResolvedValue([
        {
          id: 's1',
          name: 'Mate 1',
          planCode: 'M1',
          year: 1,
          hours: 96,
          prerequisites: [],
        },
        {
          id: 's2',
          name: 'Fisica 1',
          planCode: 'F1',
          year: 1,
          hours: 96,
          prerequisites: [],
        },
      ]);
      // Usuario tiene horarios guardados (1 mismo dia/turno para s1 y s2)
      mockPrismaService.timetable.findMany.mockResolvedValue([
        {
          id: 't1',
          subjectId: 's1',
          subject: { name: 'Mate 1' },
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
        {
          id: 't2',
          subjectId: 's2',
          subject: { name: 'Fisica 1' },
          period: TimePeriod.M1,
          dayOfWeek: 1,
        },
      ]);
      mockPrismaService.recommendedSubject.findMany.mockResolvedValue([
        { id: 'rec1', subjectId: 's1', status: 'MANTENIDA' },
        { id: 'rec2', subjectId: 's2', status: 'MANTENIDA' },
      ]);

      const result = await service.generateRecommendation('test@test.com');

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(2); // bidireccional mapping s1->s2 and s2->s1
      expect(result.recommendedSubjects).toHaveLength(2);
      expect(result.recommendedSubjects[0].status).toBe('MANTENIDA');
      expect(result.recommendedSubjects[0].timetables).toBeDefined();
    });
  });

  describe('updateRecommendationStatus', () => {
    it('debería lanzar NotFound si el usuario no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateRecommendationStatus('t@t.com', {
          subjectId: 's1',
          status: 'MANTENIDA',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFound si la materia no existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findUnique.mockResolvedValue(null);
      await expect(
        service.updateRecommendationStatus('t@t.com', {
          subjectId: 's1',
          status: 'MANTENIDA',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequest si estado es MANTENIDA y no hay timetable propuesto', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 's1' });
      await expect(
        service.updateRecommendationStatus('t@t.com', {
          subjectId: 's1',
          status: 'MANTENIDA',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería upsert recommendation y upsert timetable si es MANTENIDA', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 's1' });

      await service.updateRecommendationStatus('t@t.com', {
        subjectId: 's1',
        status: 'MANTENIDA',
        timetable: { subjectId: 's1', period: TimePeriod.M1, dayOfWeek: 1 },
      });

      expect(mockPrismaService.recommendedSubject.upsert).toHaveBeenCalled();
      expect(mockPrismaService.timetable.upsert).toHaveBeenCalled();
    });

    it('debería borrar horarios si es DELETED', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 's1' });

      await service.updateRecommendationStatus('t@t.com', {
        subjectId: 's1',
        status: 'DELETED',
      });

      expect(mockPrismaService.recommendedSubject.upsert).toHaveBeenCalled();
      expect(mockPrismaService.timetable.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', subjectId: 's1' },
      });
    });
  });

  describe('getRecommendations', () => {
    it('debería llamar a generateRecommendation internamente', async () => {
      const spy = jest
        .spyOn(service, 'generateRecommendation')
        .mockResolvedValue({
          recommendedSubjects: [],
          conflicts: [],
          hasConflicts: false,
        });

      await service.getRecommendations('test@test.com');
      expect(spy).toHaveBeenCalledWith('test@test.com');
    });
  });
});
