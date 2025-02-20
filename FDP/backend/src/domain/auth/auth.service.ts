import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { Member } from '../member/member.entity';
import { VerificationType } from '../email/email-verification.entity';
import { IVerificationResult } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private emailService: EmailService
  ) {}

  async sendVerificationEmail(
    email: string,
    type: VerificationType
  ): Promise<IVerificationResult> {
    try {
      const result = await this.emailService.sendVerificationEmail(email, type);
      return result;
    } catch (error) {
      throw new BadRequestException('이메일 전송에 실패했습니다.');
    }
  }

  async verifyEmail(
    email: string,
    code: string,
    type: VerificationType
  ): Promise<IVerificationResult> {
    // 1. 이메일 인증 검증
    const result = await this.emailService.verifyEmail(email, code, type);

    if (type === VerificationType.SIGNUP) {
      // 2. 회원 존재 여부 확인
      const member = await this.memberRepository.findOne({
        where: { email },
      });

      if (!member) {
        throw new BadRequestException('가입되지 않은 이메일입니다.');
      }

      if (member.isEmailVerified) {
        throw new BadRequestException('이미 인증된 이메일입니다.');
      }

      // 3. 이메일 인증 상태 업데이트
      await this.memberRepository.update({ email }, { isEmailVerified: true });
    }

    return result;
  }
}
