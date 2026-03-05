import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { EnvironmentAuthGuard } from '../../src/common/guards/environment-auth.guard';

describe('Schedule Controller (Integration)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(EnvironmentAuthGuard)
            .useValue({ canActivate: () => { throw new UnauthorizedException(); } })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /schedule/timetable', () => {
        it('should return 401 without token', () => {
            return request(app.getHttpServer())
                .get('/schedule/timetable')
                .expect(401);
        });
    });
});
