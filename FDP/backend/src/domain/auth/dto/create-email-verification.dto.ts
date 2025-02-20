import { IsEmail, IsEnum } from 'class-validator';
import { VerificationType } from '../../email/email-verification.entity';

export class CreateEmailVerificationDto {
  @IsEmail()
  email!: string;

  @IsEnum(VerificationType)
  type!: VerificationType;
}
