import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  EmailVerification,
  VerificationType,
  VerificationStatus,
} from './email-verification.entity';
import { IVerificationResult } from '../auth/interfaces';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    @InjectRepository(EmailVerification)
    private emailVerificationRepository: Repository<EmailVerification>
  ) {}

  async sendVerificationEmail(
    email: string,
    type: VerificationType
  ): Promise<IVerificationResult> {
    try {
      // 기존 진행중인 인증이 있는지 확인
      const existingVerification =
        await this.emailVerificationRepository.findOne({
          where: {
            email,
            type,
            status: VerificationStatus.PENDING,
            expiresAt: MoreThan(new Date()),
          },
        });

      if (existingVerification) {
        await this.emailVerificationRepository.update(
          { id: existingVerification.id },
          { status: VerificationStatus.EXPIRED }
        );
      }

      const verificationData = {
        email,
        type,
        verificationCode: this.generateVerificationCode(),
        expiresAt: this.calculateExpirationTime(),
        status: VerificationStatus.PENDING,
      };

      const savedVerification =
        await this.emailVerificationRepository.save(verificationData);

      try {
        await this.mailerService.sendMail({
          to: email,
          subject: 'FDP 이메일 인증',
          html: `
            <h1>FDP 이메일 인증</h1>
            <p>아래 인증 코드를 입력해주세요:</p>
            <h2>${verificationData.verificationCode}</h2>
            <p>10분 동안 유효합니다.</p>
          `,
        });
      } catch (emailError) {
        console.error('이메일 전송 실패 상세 정보:', emailError);
        await this.emailVerificationRepository.update(
          { id: savedVerification.id },
          { status: VerificationStatus.FAILED }
        );
        throw new BadRequestException('이메일 전송에 실패했습니다.');
      }

      return {
        message: '인증 코드가 이메일로 전송되었습니다.',
      };
    } catch (error) {
      throw new BadRequestException('이메일 전송에 실패했습니다.');
    }
  }

  async verifyEmail(
    email: string,
    code: string,
    type: VerificationType
  ): Promise<IVerificationResult> {
    const verification = await this.emailVerificationRepository.findOne({
      where: {
        email,
        verificationCode: code,
        type,
        status: VerificationStatus.PENDING,
      },
    });

    if (!verification) {
      throw new BadRequestException('유효하지 않은 인증 코드입니다.');
    }

    if (verification.expiresAt < new Date()) {
      await this.emailVerificationRepository.update(
        { id: verification.id },
        { status: VerificationStatus.EXPIRED }
      );
      throw new BadRequestException('만료된 인증 코드입니다.');
    }

    await this.emailVerificationRepository.update(
      { id: verification.id },
      { status: VerificationStatus.COMPLETED }
    );

    return {
      message: '이메일이 성공적으로 인증되었습니다.',
    };
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  private calculateExpirationTime(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    return expiresAt;
  }
}
