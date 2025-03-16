import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { Member } from '../member/member.entity';
import { VerificationType } from '../email/email-verification.entity';
import { IVerificationResult } from './interfaces';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private emailService: EmailService
  ) {}

  async signup(signupDto: SignupDto): Promise<Member> {
    // 1. 이메일 중복 확인
    const existingMember = await this.memberRepository.findOne({
      where: { email: signupDto.email },
      withDeleted: true, // 삭제된 계정도 확인
    });

    if (existingMember) {
      if (existingMember.deletedAt) {
        throw new ConflictException('탈퇴한 이메일입니다.');
      }
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    // 2. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // 3. 회원 생성
    const member = this.memberRepository.create({
      email: signupDto.email,
      password: hashedPassword,
      isEmailVerified: false,
    });

    // 4. 회원 저장
    const savedMember = await this.memberRepository.save(member);

    // 5. 이메일 인증 메일 발송
    await this.sendVerificationEmail(signupDto.email, VerificationType.SIGNUP);

    // 만약 이메일 인증을 받지 않는다면 로그인 해도 이메일 인증 받으라고 진행할 계획.

    // 6. 비밀번호 제외하고 반환
    const { password, ...memberWithoutPassword } = savedMember;
    return memberWithoutPassword as Member;
  }

  async sendVerificationEmail(
    email: string,
    type: VerificationType
  ): Promise<IVerificationResult> {
    const member = await this.memberRepository.findOne({
      where: { email },
    });

    if (!member) {
      throw new BadRequestException('가입되지 않은 이메일입니다.');
    }

    if (member.isEmailVerified && type === VerificationType.SIGNUP) {
      throw new BadRequestException('이미 인증된 이메일입니다.');
    }

    return this.emailService.sendVerificationEmail(email, type);
  }

  async verifyEmail(
    email: string,
    code: string,
    type: VerificationType
  ): Promise<IVerificationResult> {
    const member = await this.memberRepository.findOne({
      where: { email },
    });

    if (!member) {
      throw new BadRequestException('가입되지 않은 이메일입니다.');
    }

    if (member.isEmailVerified && type === VerificationType.SIGNUP) {
      throw new BadRequestException('이미 인증된 이메일입니다.');
    }

    const result = await this.emailService.verifyEmail(email, code, type);

    if (type === VerificationType.SIGNUP) {
      await this.memberRepository.update(
        { id: member.id },
        { isEmailVerified: true }
      );
    }

    return result;
  }

  // 현재 JWT 관련 로직은 따로 구현해야 함.
  async signin(signinDto: SigninDto) {
    // 1. 이메일로 회원 찾기
    const member = await this.memberRepository.findOne({
      where: { email: signinDto.email },
    });

    if (!member) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.'
      );
    }

    // 2. 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      signinDto.password,
      member.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.'
      );
    }

    // 3. 비밀번호 제외하고 반환
    const { password, ...memberWithoutPassword } = member;
    return memberWithoutPassword;
  }
}
