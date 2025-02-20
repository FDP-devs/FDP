import { IsEmail, IsString, IsEnum } from 'class-validator';
import { VerificationType } from '../../email/email-verification.entity';

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;

  @IsEnum(VerificationType)
  type!: VerificationType;
}
