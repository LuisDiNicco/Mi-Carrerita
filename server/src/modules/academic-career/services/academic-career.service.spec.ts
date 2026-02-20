import { Test, TestingModule } from '@nestjs/testing';
import { AcademicCareerService } from './academic-career.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubjectStatus } from '../../../common/constants/academic-enums';

jest.mock('../../../common/helpers/academic-validation.helper', () => ({
  validateAcademicRecord: jest.fn(),
  parseIsolatedDate: jest.fn().mockReturnValue(new Date('2023-01-01')),
}));

describe('AcademicCareerService', () => {
  let service: AcademicCareerService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    subject: { findMany: jest.fn(), findUnique: jest.fn() },
    academicRecord: { upsert: jest.fn() },
  };

  const mockEventEmitter = { emit: jest.fn() };
  const mockLogger = { log: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicCareerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AcademicCareerService>(AcademicCareerService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCareerGraph', () => {
    it('debería lanzar NotFoundException si no existe el user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getCareerGraph('test@test.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería retornar el grafo de materias correctamente formateado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findMany.mockResolvedValue([
        {
          id: 's1',
          planCode: 'MAT01',
          name: 'Mate',
          year: 1,
          hours: 64,
          isOptional: false,
          prerequisites: [],
          records: [
            {
              status: SubjectStatus.APROBADA,
              finalGrade: 90,
              difficulty: 5,
              statusDate: new Date('2023-01-01'),
              notes: '',
            },
          ],
        },
      ]);

      const result = await service.getCareerGraph('test@test.com');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
      expect(result[0].status).toBe(SubjectStatus.APROBADA);
      expect(result[0].grade).toBe(90);
    });
  });

  describe('updateSubjectRecord', () => {
    it('debería lanzar NotFoundException si no existe el user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateSubjectRecord('t@t.com', 's1', {
          status: SubjectStatus.APROBADA,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException si no existe la materia', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findUnique.mockResolvedValue(null);
      await expect(
        service.updateSubjectRecord('t@t.com', 's1', {
          status: SubjectStatus.APROBADA,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería actualizar satisfactoriamente y emitir el eventEmitter', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findUnique.mockResolvedValue({ id: 's1' });

      const payload = {
        status: SubjectStatus.APROBADA,
        grade: 100,
        difficulty: 7,
        notes: 'Fácil',
      };
      const recordCreated = { id: 'r1', ...payload };

      mockPrismaService.academicRecord.upsert.mockResolvedValue(recordCreated);

      const result = await service.updateSubjectRecord(
        'test@test.com',
        's1',
        payload,
      );

      expect(mockPrismaService.academicRecord.upsert).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'subject.status.updated',
        { userEmail: 'test@test.com' },
      );
      expect(result).toEqual(recordCreated);
    });
  });
});
