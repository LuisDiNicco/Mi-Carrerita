import { Test, TestingModule } from '@nestjs/testing';
import { AcademicHistoryService } from './academic-history.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import * as academicValidationHelper from '../../../common/helpers/academic-validation.helper';
import * as historyHelpers from '../helpers/history.helpers';

// Mocking helpers to isolate logic
jest.mock('../../../common/helpers/academic-validation.helper', () => ({
  validateAcademicRecord: jest.fn(),
  parseIsolatedDate: jest.fn(),
}));

jest.mock('../helpers/history.helpers', () => ({
  buildWhereClause: jest.fn(),
  buildSubjectWhereClause: jest.fn(),
  buildOrderByClause: jest.fn(),
  inferSemesterFromDate: jest.fn(),
}));

describe('AcademicHistoryService', () => {
  let service: AcademicHistoryService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    academicRecord: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventEmitter = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicHistoryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AcademicHistoryService>(AcademicHistoryService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHistory', () => {
    it('debería lanzar NotFound si no se encuentra el usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getHistory('test@test.com', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería retornar datos paginados mapeados correctamente', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      (historyHelpers.buildWhereClause as jest.Mock).mockReturnValue({
        userId: 'u1',
      });
      (historyHelpers.buildSubjectWhereClause as jest.Mock).mockReturnValue({});
      (historyHelpers.buildOrderByClause as jest.Mock).mockReturnValue({
        statusDate: 'desc',
      });
      (historyHelpers.inferSemesterFromDate as jest.Mock).mockReturnValue(1);

      const mockRecords = [
        {
          id: 'r1',
          subjectId: 's1',
          userId: 'u1',
          status: SubjectStatus.APROBADA,
          finalGrade: 90,
          statusDate: new Date('2024-01-01'),
          subject: {
            id: 's1',
            name: 'Materia 1',
            planCode: 'P1',
            year: 1,
            hours: 96,
          },
        },
      ];

      mockPrismaService.$transaction.mockResolvedValue([1, mockRecords]);

      const result = await service.getHistory('test@test.com', {
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('r1');
      expect(result.data[0].semester).toBe(1);
      expect(result.data[0].statusDate).toBe('2024-01-01');
    });
  });

  describe('updateRecord', () => {
    it('debería lanzar NotFound si no se encuentra el usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updateRecord('t@t.com', 'r1', {
          status: SubjectStatus.APROBADA,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFound si no se encuentra el record', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findUnique.mockResolvedValue(null);
      await expect(
        service.updateRecord('t@t.com', 'r1', {
          status: SubjectStatus.APROBADA,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ForbiddenException si el record no pertenece al user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findUnique.mockResolvedValue({
        userId: 'u2',
      }); // Other user
      await expect(
        service.updateRecord('t@t.com', 'r1', {
          status: SubjectStatus.APROBADA,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debería validar, actualizar y emitir evento si está ok', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findUnique.mockResolvedValue({
        userId: 'u1',
        isIntermediate: false,
      });

      (academicValidationHelper.parseIsolatedDate as jest.Mock).mockReturnValue(
        new Date('2024-02-02'),
      );
      (historyHelpers.inferSemesterFromDate as jest.Mock).mockReturnValue(1);

      const updatedRecord = {
        id: 'r1',
        subjectId: 's1',
        status: SubjectStatus.APROBADA,
        statusDate: new Date('2024-02-02'),
        subject: {
          id: 's1',
          name: 'Materia 1',
          planCode: 'P1',
          year: 1,
          hours: 96,
        },
      };

      mockPrismaService.academicRecord.update.mockResolvedValue(updatedRecord);

      const result = await service.updateRecord('t@t.com', 'r1', {
        status: SubjectStatus.APROBADA,
        finalGrade: 85,
        statusDate: '2024-02-02',
      });

      expect(
        academicValidationHelper.validateAcademicRecord,
      ).toHaveBeenCalled();
      expect(mockPrismaService.academicRecord.update).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'subject.status.updated',
        { userEmail: 't@t.com' },
      );
      expect(result.id).toBe('r1');
    });
  });

  describe('deleteRecord', () => {
    it('debería lanzar NotFound si no se encuentra el user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteRecord('t@t.com', 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar NotFound si no se encuentra el record', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findUnique.mockResolvedValue(null);
      await expect(service.deleteRecord('t@t.com', 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar ForbiddenException si el record no es del usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findUnique.mockResolvedValue({
        userId: 'u2',
      });
      await expect(service.deleteRecord('t@t.com', 'r1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debería eliminar y emitir evento', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.findUnique.mockResolvedValue({
        userId: 'u1',
      });
      mockPrismaService.academicRecord.delete.mockResolvedValue({});

      await service.deleteRecord('t@t.com', 'r1');
      expect(mockPrismaService.academicRecord.delete).toHaveBeenCalledWith({
        where: { id: 'r1' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'subject.status.updated',
        { userEmail: 't@t.com' },
      );
    });
  });

  describe('deleteAll', () => {
    it('debería lanzar NotFound si no user en deleteAll', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteAll('t@t.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería eliminar todos y emitir evento', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.academicRecord.deleteMany.mockResolvedValue({
        count: 5,
      });

      await service.deleteAll('test@test.com');
      expect(mockPrismaService.academicRecord.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'subject.status.updated',
        { userEmail: 'test@test.com' },
      );
    });
  });
});
