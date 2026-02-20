import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TimePeriod } from '../../../common/constants/schedule-enums';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    subject: { findMany: jest.fn(), findUnique: jest.fn() },
    timetable: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockEventEmitter = { emit: jest.fn() };
  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    mockPrismaService.$transaction.mockImplementation((cb) =>
      cb(mockPrismaService),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setMultipleTimetables', () => {
    it('debería lanzar NotFound si no se encuentra el usuario', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.setMultipleTimetables('test@test.com', []),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería rechazar si la validación falla (ej. día inválido)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findMany.mockResolvedValue([
        { id: 's1', name: 'Materia 1', planCode: 'M1' },
      ]);
      mockPrismaService.timetable.findMany.mockResolvedValue([]);

      await expect(
        service.setMultipleTimetables('test@test.com', [
          { subjectId: 's1', dayOfWeek: 8, period: TimePeriod.M1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería rechazar si hay un conflicto', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });

      // Simulamos materias
      mockPrismaService.subject.findMany.mockResolvedValue([
        { id: 's1', name: 'Materia 1', planCode: 'M1' },
      ]);

      // Simulamos que el usuario tiene un horario existente que choca
      mockPrismaService.timetable.findMany.mockResolvedValue([
        {
          subjectId: 's2',
          period: TimePeriod.M1,
          dayOfWeek: 1,
          subject: { name: 'Materia 2', planCode: 'M2' },
        },
      ]);

      await expect(
        service.setMultipleTimetables('test@test.com', [
          { subjectId: 's1', dayOfWeek: 1, period: TimePeriod.M1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería procesar en bulk sin N+1 usando el pre-fetch refactorizado', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrismaService.subject.findMany.mockResolvedValue([
        { id: 's1', name: 'Materia 1', planCode: 'M1' },
        { id: 's2', name: 'Materia 2', planCode: 'M2' },
      ]);
      mockPrismaService.timetable.findMany.mockResolvedValue([]);

      const createdDtos = [
        { id: 't1', subjectId: 's1', period: TimePeriod.M1, dayOfWeek: 1 },
        { id: 't2', subjectId: 's2', period: TimePeriod.T1, dayOfWeek: 2 },
      ];

      mockPrismaService.timetable.upsert
        .mockResolvedValueOnce(createdDtos[0])
        .mockResolvedValueOnce(createdDtos[1]);

      const result = await service.setMultipleTimetables('test@test.com', [
        { subjectId: 's1', period: TimePeriod.M1, dayOfWeek: 1 },
        { subjectId: 's2', period: TimePeriod.T1, dayOfWeek: 2 },
      ]);

      expect(result.length).toBe(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      // Sólo debe llamarse el findMany 2 veces (una para materias y otra para horarios) pre-transaction en batch.
      expect(mockPrismaService.subject.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.timetable.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
