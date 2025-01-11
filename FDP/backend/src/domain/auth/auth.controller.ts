import {
  Controller,
  Post,
  Body,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendVerificationEmailDto } from '../email/dto/send-verification-email.dto';
import { VerifyEmailDto } from '../email/dto/verify-email.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verifications')
  @HttpCode(201)
  async sendVerificationEmail(@Body() dto: SendVerificationEmailDto) {
    try {
      await this.authService.sendVerificationEmail(dto.email);
      return { message: '인증 코드가 이메일로 전송되었습니다.' };
    } catch (error) {
      throw new BadRequestException('이메일 전송에 실패했습니다.');
    }
  }

  @Post('verifications/confirm')
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    try {
      await this.authService.verifyEmail(dto.email, dto.verificationCode);
      return { message: '이메일이 성공적으로 인증되었습니다.' };
    } catch (error) {
      throw new BadRequestException('이메일 인증에 실패했습니다.');
    }
  }
}
