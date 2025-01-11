import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailModule } from '../email/email.module';
import { Member } from '../member/member.entity';
import { EmailVerification } from '../email/email-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Member, EmailVerification]), EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
