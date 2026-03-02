import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { EnvironmentAuthGuard } from '../../src/common/guards/environment-auth.guard';

describe('Academic Career Controller (Integration)', () => {
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

    describe('GET /academic-career/graph', () => {
        it('should return 401 when no token is provided', () => {
            return request(app.getHttpServer())
                .get('/academic-career/graph')
                .expect(401);
        });
    });
});
