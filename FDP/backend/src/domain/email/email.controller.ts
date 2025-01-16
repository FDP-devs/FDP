import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendVerificationEmailDto } from './dto/send-verification-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('api/v1/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('verification/send')
  async sendVerificationEmail(
    @Body() sendVerificationEmailDto: SendVerificationEmailDto
  ) {
    await this.emailService.sendVerificationEmail(
      sendVerificationEmailDto.email
    );
    return { message: '인증 메일이 발송되었습니다.' };
  }

  @Post('verification/verify')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const isVerified = await this.emailService.verifyEmail(
      verifyEmailDto.email,
      verifyEmailDto.verificationCode
    );
    return { verified: isVerified };
  }
}
