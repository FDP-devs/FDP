import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Response } from 'supertest';
const request = require('supertest');
import { DataSource, Like, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { Member } from '../../src/domain/member/member.entity';
import { EmailVerification } from '../../src/domain/email/email-verification.entity';
import { VerificationType } from '../../src/domain/email/email-verification.entity';
import { ConfigService } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let memberRepository: Repository<Member>;
  let verificationRepository: Repository<EmailVerification>;
  let configService: ConfigService;
  let testEmail: string;

  beforeAll(async () => {
    jest.setTimeout(30000);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();

    // 데이터베이스 연결 확인
    try {
      dataSource = app.get<DataSource>(DataSource);
      console.log('Database connection status:', dataSource.isInitialized);
      memberRepository = dataSource.getRepository(Member);
      verificationRepository = dataSource.getRepository(EmailVerification);

      // ConfigService 가져오기
      configService = app.get<ConfigService>(ConfigService);

      // 테스트 이메일 설정 (.env.test에서 가져오거나 기본값 사용)
      testEmail = configService.get('SMTP_TO_EMAIL') || 'test-flow@example.com';

      // 테스트 데이터베이스 초기화
      if (memberRepository && verificationRepository) {
        await memberRepository.delete({ email: Like('%test%') });
        await verificationRepository.delete({ email: Like('%test%') });
      }
    } catch (error) {
      console.error('Database connection error:', error);
    }
  });

  afterAll(async () => {
    try {
      if (app && memberRepository && verificationRepository) {
        await memberRepository.delete({ email: Like('%test%') });
        await verificationRepository.delete({ email: Like('%test%') });
        await app.close();
      }
    } catch (error) {
      console.error('데이터베이스 정리 중 오류 발생:', error);
      if (app) await app.close();
    }
  });

  describe('/api/v1/auth/signin (POST)', () => {
    const testPassword = 'password123';
    let testMember: Member;

    // 테스트 전에 회원 생성
    beforeEach(async () => {
      try {
        // 기존 테스트 데이터 정리
        await memberRepository.delete({ email: testEmail });

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(testPassword, 10);

        // 테스트용 회원 생성
        testMember = memberRepository.create({
          email: testEmail,
          password: hashedPassword,
          isEmailVerified: true, // 이메일 인증 완료 상태
        });
        await memberRepository.save(testMember);
      } catch (error) {
        console.error('테스트 데이터 준비 중 오류 발생:', error);
        throw error;
      }
    });

    it('should return 401 when email does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401)
        .expect((res: Response) => {
          expect(res.body.message).toBe(
            '이메일 또는 비밀번호가 일치하지 않습니다.'
          );
        });
    });

    it('should return 401 when password is incorrect', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res: Response) => {
          expect(res.body.message).toBe(
            '이메일 또는 비밀번호가 일치하지 않습니다.'
          );
        });
    });

    it('should return 200 and member data when credentials are valid', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.message).toBe('로그인이 완료되었습니다.');
          expect(res.body.data).toBeDefined();
          expect(res.body.data.email).toBe(testEmail);
          expect(res.body.data.isEmailVerified).toBe(true);
          expect(res.body.data).not.toHaveProperty('password');
        });
    });

    it('should allow login for users with unverified email', async () => {
      // 이메일 미인증 상태로 변경
      await memberRepository.update(
        { email: testEmail },
        { isEmailVerified: false }
      );

      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200)
        .expect((res: Response) => {
          expect(res.body.message).toBe('로그인이 완료되었습니다.');
          expect(res.body.data).toBeDefined();
          expect(res.body.data.email).toBe(testEmail);
          expect(res.body.data.isEmailVerified).toBe(false);
          expect(res.body.data).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid request data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'invalid-email',
          password: '',
        })
        .expect(400);
    });
  });

  // 회원가입 및 이메일 인증 테스트를 추가할 수 있습니다
  describe('Full authentication flow', () => {
    const testPassword = 'password123';

    beforeEach(async () => {
      try {
        // 기존 테스트 데이터 정리 (soft delete 무시하고 완전히 삭제)
        await memberRepository.query(
          `DELETE FROM members WHERE email = '${testEmail}'`
        );
        await verificationRepository.delete({ email: testEmail });
      } catch (error) {
        console.error('테스트 데이터 정리 중 오류 발생:', error);
      }
    });

    it('should allow signup, email verification, and signin', async () => {
      // 1. 회원가입
      const signupResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect((res: Response) => {
          console.log('Signup response status:', res.status);
          console.log('Signup response body:', res.body);
        });

      // 그 후에 별도로 상태 코드 검증
      expect(signupResponse.status).toBe(201);

      // 2. 인증 코드 가져오기 (실제 애플리케이션에서는 이메일로 전송됨)
      const verification = await verificationRepository.findOne({
        where: { email: testEmail, type: VerificationType.SIGNUP },
      });
      expect(verification).toBeDefined();

      console.log('verification', verification);

      // 3. 이메일 인증
      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verifications/verify')
        .send({
          email: testEmail,
          verificationCode: verification?.verificationCode,
        });
      // .expect(200);

      console.log('verifyResponse', verifyResponse);

      expect(verifyResponse.body.message).toContain(
        '이메일 인증이 완료되었습니다'
      );

      // 4. 로그인
      const signinResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(signinResponse.body.message).toBe('로그인이 완료되었습니다.');
      expect(signinResponse.body.data.email).toBe(testEmail);
      expect(signinResponse.body.data.isEmailVerified).toBe(true);
    });
  });
});
