import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { SendVerificationEmailDto } from '../email/dto/send-verification-email.dto';
import { VerifyEmailDto } from '../email/dto/verify-email.dto';
import { VerificationType } from '../email/email-verification.entity';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    const member = await this.authService.signup(signupDto);
    return {
      message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
      data: member,
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() signinDto: SigninDto) {
    const result = await this.authService.signin(signinDto);
    return {
      message: '로그인이 완료되었습니다.',
      data: result,
    };
  }

  @Post('verifications')
  @HttpCode(HttpStatus.CREATED)
  async createVerification(
    @Body() dto: SendVerificationEmailDto,
    @Query('type') type: VerificationType = VerificationType.SIGNUP
  ) {
    const result = await this.authService.sendVerificationEmail(
      dto.email,
      type
    );

    const messages = {
      [VerificationType.SIGNUP]:
        '회원가입 인증 코드가 이메일로 전송되었습니다.',
      [VerificationType.PW_RESET]:
        '비밀번호 재설정 코드가 이메일로 전송되었습니다.',
    };

    return {
      message: messages[type] || '인증 코드가 이메일로 전송되었습니다.',
      data: result,
    };
  }

  @Post('verifications/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Query('type') type: VerificationType = VerificationType.SIGNUP
  ) {
    const result = await this.authService.verifyEmail(
      dto.email,
      dto.verificationCode,
      type
    );

    const messages = {
      [VerificationType.SIGNUP]: '이메일 인증이 완료되었습니다.',
      [VerificationType.PW_RESET]: '비밀번호를 재설정해주세요.',
    };

    return {
      message: messages[type] || '이메일이 성공적으로 인증되었습니다.',
      data: result,
    };
  }
}
