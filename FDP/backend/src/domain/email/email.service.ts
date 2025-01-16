import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail(email: string, verificationCode: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'FDP 이메일 인증',
        html: `
            <h1>FDP 이메일 인증</h1>
            <p>아래 인증 코드를 입력해주세요:</p>
            <h2>${verificationCode}</h2>
            <p>10분 동안 유효합니다.</p>
          `,
      });
    } catch (error: any) {
      this.logger.error('SMTP Error Details:', {
        error: error.message,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response,
        stack: error.stack,
      });

      throw new BadRequestException('이메일 전송에 실패했습니다.');
    }
  }
}
