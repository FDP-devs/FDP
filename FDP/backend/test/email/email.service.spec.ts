import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from '../../src/domain/email/email.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailVerification } from '../../src/domain/email/email-verification.entity';
import { Repository } from 'typeorm';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let emailVerificationRepo: Repository<EmailVerification>;

  beforeAll(async () => {
    // Given: 테스트에 필요한 mock 객체들을 준비
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const mockRepository = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
      softDelete: jest.fn().mockResolvedValue({}),
      findOne: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: getRepositoryToken(EmailVerification),
          useValue: mockRepository,
        },
        ConfigService,
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    emailVerificationRepo = module.get<Repository<EmailVerification>>(
      getRepositoryToken(EmailVerification)
    );
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      // Given: 테스트용 이메일 주소 준비
      const email = 'test@example.com';

      // When: 이메일 발송 실행
      await service.sendVerificationEmail(email);

      // Then: Repository와 MailerService가 올바르게 호출되었는지 검증
      expect(emailVerificationRepo.softDelete).toHaveBeenCalledWith({ email });
      expect(emailVerificationRepo.create).toHaveBeenCalled();
      expect(emailVerificationRepo.save).toHaveBeenCalled();
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'FDP 이메일 인증',
        html: expect.stringContaining('<h1>FDP 이메일 인증</h1>'),
      });
    });

    it('should throw BadRequestException when email sending fails', async () => {
      // Given: 실패 상황 설정
      const email = 'test@example.com';
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new BadRequestException('SMTP connection failed'));

      // When & Then: 에러 발생 및 검증
      await expect(service.sendVerificationEmail(email)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Given: 유효한 인증 정보 설정
      const mockVerification = {
        id: '1',
        email: 'test@example.com',
        verificationCode: '123456',
        expiresAt: new Date(Date.now() + 1000 * 60),
      };

      // 먼저 인증 정보를 저장
      jest
        .spyOn(emailVerificationRepo, 'create')
        .mockReturnValue(mockVerification as EmailVerification);
      await emailVerificationRepo.save(mockVerification);

      // 그 다음 findOne mock 설정
      jest
        .spyOn(emailVerificationRepo, 'findOne')
        .mockResolvedValue(mockVerification as EmailVerification);
      jest.spyOn(emailVerificationRepo, 'delete').mockResolvedValue({} as any);

      // When: 이메일 인증 실행
      const result = await service.verifyEmail('test@example.com', '123456');

      // Then: 인증 성공 확인
      expect(result).toBe(true);
      expect(emailVerificationRepo.save).toHaveBeenCalledWith(mockVerification);
      expect(emailVerificationRepo.findOne).toHaveBeenCalled();
    });
  });
});
