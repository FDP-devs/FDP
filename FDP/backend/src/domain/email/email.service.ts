import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
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
    } catch (error) {
      throw new BadRequestException('이메일 전송에 실패했습니다.');
    }
  }
}
