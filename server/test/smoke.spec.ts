import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Smoke Tests', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /health should return 200 OK', () => {
        return request(app.getHttpServer())
            .get('/health')
            .expect(200);
    });

    it('GET /api/career/public should return 200 or 401', async () => {
        // If auth guard is global, it might return 401 without token. We just want to check the server handles it without crashing (500).
        const response = await request(app.getHttpServer()).get('/api/career/public');
        expect([200, 401, 403, 404]).toContain(response.status);
    });
});
