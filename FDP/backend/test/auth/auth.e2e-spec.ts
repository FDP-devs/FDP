import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.setTimeout(120000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();
  });

  describe('/api/v1/auth/verifications (POST)', () => {
    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verifications')
        .send({ email: 'invalid-email' })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should reject empty email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verifications')
        .send({ email: '' })
        .expect(400);
    });

    it('should accept valid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verifications')
        .send({ email: 'test@example.com' })
        .expect(201)
        .expect(res => {
          expect(res.body.message).toBe('인증 코드가 이메일로 전송되었습니다.');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
