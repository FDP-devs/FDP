import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from '../../src/domain/email/email.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Given: 테스트 환경 설정
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        ConfigService,
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      // Given: ConfigService에서 이메일 주소 가져오기
      const email: string = configService.get<string>('SMTP_TO_EMAIL')!;
      const code = '123456';

      // When: 이메일 발송 실행
      await service.sendVerificationEmail(email, code);

      // Then: 결과 검증
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'FDP 이메일 인증',
        html: expect.stringContaining(code),
      });
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when email sending fails', async () => {
      // Given: 실패 상황 설정
      const email: string = configService.get<string>('SMTP_TO_EMAIL')!;
      const code = '123456';
      const errorMessage = 'SMTP connection failed';
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new Error(errorMessage));

      // When & Then: 에러 발생 및 검증
      await expect(service.sendVerificationEmail(email, code)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle various email sending errors appropriately', async () => {
      // Given: 다양한 에러 케이스 준비
      const email: string = configService.get<string>('SMTP_TO_EMAIL')!;
      const code = '123456';
      const errorCases = [
        {
          error: new Error('Invalid recipient'),
          expectedMessage: '이메일 전송에 실패했습니다.',
        },
        {
          error: new Error('SMTP connection timeout'),
          expectedMessage: '이메일 전송에 실패했습니다.',
        },
      ];

      for (const { error } of errorCases) {
        // When: 에러 상황 설정
        jest.spyOn(mailerService, 'sendMail').mockRejectedValue(error);

        // Then: 에러 처리 검증
        await expect(
          service.sendVerificationEmail(email, code)
        ).rejects.toThrow(BadRequestException);
      }
    });
  });
});
