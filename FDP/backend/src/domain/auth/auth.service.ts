import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { Member } from '../member/member.entity';
import { EmailVerification } from '../email/email-verification.entity';
import { IEmailVerification, IVerificationResult } from './interfaces';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>,
    private emailService: EmailService
  ) {}

  async sendVerificationEmail(email: string): Promise<IVerificationResult> {
    try {
      const verificationData: IEmailVerification = {
        email,
        verificationCode: this.generateVerificationCode(),
        expiresAt: this.calculateExpiryTime(),
      };

      await this.emailVerificationRepository.save(verificationData);
      await this.emailService.sendVerificationEmail(
        verificationData.email,
        verificationData.verificationCode
      );

      return {
        message: '인증 코드가 이메일로 전송되었습니다.',
      };
    } catch (error) {
      throw new BadRequestException('이메일 전송에 실패했습니다.');
    }
  }

  async verifyEmail(email: string, code: string): Promise<IVerificationResult> {
    const verification = await this.emailVerificationRepository.findOne({
      where: { email, verificationCode: code },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new BadRequestException('유효하지 않거나 만료된 인증 코드입니다.');
    }

    await this.memberRepository.update({ email }, { isEmailVerified: true });
    await this.emailVerificationRepository.remove(verification);

    return {
      message: '이메일이 성공적으로 인증되었습니다.',
    };
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  private calculateExpiryTime(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    return expiresAt;
  }
}
