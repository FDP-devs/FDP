import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailVerification } from './email-verification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private mailerService: MailerService,
    @InjectRepository(EmailVerification)
    private emailVerificationRepo: Repository<EmailVerification>
  ) {}

  async sendVerificationEmail(email: string) {
    await this.emailVerificationRepo.softDelete({ email });

    const verificationCode = Math.random().toString().slice(2, 8);
    const verification = this.emailVerificationRepo.create({
      email,
      verificationCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await this.emailVerificationRepo.save(verification);

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
  }
  catch(error: any) {
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

  /*
    todo: 코
  */
  async verifyEmail(email: string, code: string): Promise<boolean> {
    const verification = await this.emailVerificationRepo.findOne({
      where: { email, verificationCode: code },
    });

    if (!verification) {
      throw new BadRequestException('잘못된 인증 코드입니다.');
    }

    if (verification.expiresAt < new Date()) {
      await this.emailVerificationRepo.softDelete({ id: verification.id });
      throw new BadRequestException('만료된 인증 코드입니다.');
    }

    await this.emailVerificationRepo.delete({ id: verification.id });
    return true;
  }
}
