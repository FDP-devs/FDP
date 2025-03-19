import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../../src/domain/email/email.service';
import { BadRequestException } from '@nestjs/common';
import {
  EmailVerification,
  VerificationType,
  VerificationStatus,
} from '../../src/domain/email/email-verification.entity';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let emailVerificationRepository: Repository<EmailVerification>;

  beforeEach(async () => {
    // Given: 테스트 환경 설정
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const mockRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(entity =>
        Promise.resolve({
          id: 'test-id',
          ...entity,
        })
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
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
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    emailVerificationRepository = module.get<Repository<EmailVerification>>(
      getRepositoryToken(EmailVerification)
    );
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      // Given: 테스트에 필요한 데이터 준비
      const email = 'test@example.com';
      const type = VerificationType.SIGNUP;

      // Mock 기존 인증 없음
      jest
        .spyOn(emailVerificationRepository, 'findOne')
        .mockResolvedValue(null);

      // Mock 인증 코드 생성
      jest
        .spyOn(service as any, 'generateVerificationCode')
        .mockReturnValue('123456');

      // When: 이메일 발송 실행
      const result = await service.sendVerificationEmail(email, type);

      // Then: 결과 검증
      expect(emailVerificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          type,
          verificationCode: '123456',
          status: VerificationStatus.PENDING,
        })
      );

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'FDP 이메일 인증',
        html: expect.stringContaining('123456'),
      });

      expect(result).toEqual({
        message: '인증 코드가 이메일로 전송되었습니다.',
      });
    });

    it('should expire existing verification before creating a new one', async () => {
      // Given: 기존 인증이 있는 상황
      const email = 'test@example.com';
      const type = VerificationType.SIGNUP;
      const existingVerification = {
        id: 'existing-id',
        email,
        type,
        status: VerificationStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000), // 아직 만료되지 않음
      };

      jest
        .spyOn(emailVerificationRepository, 'findOne')
        .mockResolvedValue(existingVerification as any);
      jest
        .spyOn(service as any, 'generateVerificationCode')
        .mockReturnValue('123456');

      // When: 새 인증 코드 발송
      await service.sendVerificationEmail(email, type);

      // Then: 기존 인증이 만료 처리되었는지 확인
      expect(emailVerificationRepository.update).toHaveBeenCalledWith(
        { id: existingVerification.id },
        { status: VerificationStatus.EXPIRED }
      );
    });

    it('should throw BadRequestException when email sending fails', async () => {
      // Given: 실패 상황 설정
      const email = 'test@example.com';
      const type = VerificationType.SIGNUP;
      const errorMessage = 'SMTP connection failed';

      jest
        .spyOn(emailVerificationRepository, 'findOne')
        .mockResolvedValue(null);
      jest
        .spyOn(emailVerificationRepository, 'save')
        .mockResolvedValue({ id: 'test-id' } as any);
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new Error(errorMessage));

      // When & Then: 에러 발생 및 검증
      await expect(service.sendVerificationEmail(email, type)).rejects.toThrow(
        BadRequestException
      );

      // 이메일 전송 실패 시 상태 업데이트 확인
      expect(emailVerificationRepository.update).toHaveBeenCalledWith(
        { id: 'test-id' },
        { status: VerificationStatus.FAILED }
      );
    });

    it('should handle various email sending errors appropriately', async () => {
      // Given: 다양한 에러 케이스 준비
      const email = 'test@example.com';
      const type = VerificationType.SIGNUP;
      const errorCases = [
        { error: new Error('Invalid recipient') },
        { error: new Error('SMTP connection timeout') },
      ];

      for (const { error } of errorCases) {
        // 테스트 초기화
        jest.clearAllMocks();
        jest
          .spyOn(emailVerificationRepository, 'findOne')
          .mockResolvedValue(null);
        jest
          .spyOn(emailVerificationRepository, 'save')
          .mockResolvedValue({ id: 'test-id' } as any);

        // When: 에러 상황 설정
        jest.spyOn(mailerService, 'sendMail').mockRejectedValue(error);

        // Then: 에러 처리 검증
        await expect(
          service.sendVerificationEmail(email, type)
        ).rejects.toThrow(BadRequestException);
      }
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Given: 유효한 인증 정보
      const email = 'test@example.com';
      const code = '123456';
      const type = VerificationType.SIGNUP;
      const verification = {
        id: 'verification-id',
        email,
        verificationCode: code,
        type,
        status: VerificationStatus.PENDING,
        expiresAt: new Date(Date.now() + 10000), // 아직 만료되지 않음
      };

      jest
        .spyOn(emailVerificationRepository, 'findOne')
        .mockResolvedValue(verification as any);

      // When: 이메일 인증 실행
      const result = await service.verifyEmail(email, code, type);

      // Then: 결과 검증
      expect(emailVerificationRepository.update).toHaveBeenCalledWith(
        { id: verification.id },
        { status: VerificationStatus.COMPLETED }
      );

      expect(result).toEqual({
        message: '이메일이 성공적으로 인증되었습니다.',
      });
    });

    it('should throw BadRequestException for invalid verification code', async () => {
      // Given: 유효하지 않은 인증 코드
      const email = 'test@example.com';
      const code = 'invalid';
      const type = VerificationType.SIGNUP;

      jest
        .spyOn(emailVerificationRepository, 'findOne')
        .mockResolvedValue(null);

      // When & Then: 에러 발생 및 검증
      await expect(service.verifyEmail(email, code, type)).rejects.toThrow(
        new BadRequestException('유효하지 않은 인증 코드입니다.')
      );
    });

    it('should throw BadRequestException for expired verification code', async () => {
      // Given: 만료된 인증 코드
      const email = 'test@example.com';
      const code = '123456';
      const type = VerificationType.SIGNUP;
      const verification = {
        id: 'verification-id',
        email,
        verificationCode: code,
        type,
        status: VerificationStatus.PENDING,
        expiresAt: new Date(Date.now() - 10000), // 이미 만료됨
      };

      jest
        .spyOn(emailVerificationRepository, 'findOne')
        .mockResolvedValue(verification as any);

      // When & Then: 에러 발생 및 검증
      await expect(service.verifyEmail(email, code, type)).rejects.toThrow(
        new BadRequestException('만료된 인증 코드입니다.')
      );

      // 만료 상태로 업데이트 확인
      expect(emailVerificationRepository.update).toHaveBeenCalledWith(
        { id: verification.id },
        { status: VerificationStatus.EXPIRED }
      );
    });
  });
});
