import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailVerification } from '../src/domain/email/email-verification.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Email System (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let testEmail: string;
  let emailVerificationRepository: Repository<EmailVerification>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get<ConfigService>(ConfigService);
    testEmail = configService.get<string>('SMTP_TO_EMAIL')!;
    await app.init();
  });

  beforeEach(() => {
    emailVerificationRepository = app.get(
      getRepositoryToken(EmailVerification)
    );
  });

  describe('이메일 전송 및 인증 확인', () => {
    it('should send verification email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/email/verification/send')
        .send({ email: testEmail })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('인증 메일이 발송되었습니다.');
    }, 10000);

    it('should verify email code', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/email/verification/send')
        .send({ email: testEmail });

      const verification = await emailVerificationRepository.findOne({
        where: { email: testEmail },
        order: { createdAt: 'DESC' },
      });

      const verificationCode = verification?.verificationCode;

      const response = await request(app.getHttpServer())
        .post('/api/v1/email/verification/verify')
        .send({
          email: testEmail,
          verificationCode: verificationCode,
        })
        .expect(201);

      expect(response.body).toHaveProperty('verified');
    }, 10000);

    it('should fail with invalid verification code', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/email/verification/verify')
        .send({
          email: testEmail,
          verificationCode: 'invalid',
        })
        .expect(400);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
