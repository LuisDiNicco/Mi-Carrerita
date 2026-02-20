import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AcademicCareerController } from '../src/modules/academic-career/controllers/academic-career.controller';
import { AcademicCareerService } from '../src/modules/academic-career/services/academic-career.service';
import { EnvironmentAuthGuard } from '../src/common/guards/environment-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubjectStatus } from '../src/common/constants/academic-enums';
import { CurrentUser } from '../src/common/decorators/current-user.decorator';

describe('AcademicCareerController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'u1', email: 'test@e2e.com' }),
    },
    subject: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 's1',
          name: 'Álgebra',
          planCode: 'MAT01',
          year: 1,
          hours: 96,
          isOptional: false,
          prerequisites: [],
          records: [],
        },
      ]),
    },
    academicRecord: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AcademicCareerController],
      providers: [
        AcademicCareerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        {
          provide: Logger,
          useValue: { log: jest.fn(), warn: jest.fn(), error: console.error },
        },
      ],
    })
      .overrideGuard(EnvironmentAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { email: 'test@e2e.com' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/academic-career/graph (GET) - deberia retornar el arbol vacio', async () => {
    const res = await request(app.getHttpServer()).get(
      '/academic-career/graph',
    );
    if (res.status !== 200) {
      throw new Error(
        'STATUS ' + res.status + ' BODY: ' + JSON.stringify(res.body),
      );
    }
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe('s1');
    expect(res.body[0].status).toBe(SubjectStatus.DISPONIBLE);
  });

  it('/academic-career/graph (GET) - deberia retornar 404 si no encuentra el usuario', () => {
    mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
    return request(app.getHttpServer())
      .get('/academic-career/graph')
      .expect(404)
      .expect((res: any) => {
        expect(res.body.message).toBe('Usuario no encontrado.');
      });
  });
});
