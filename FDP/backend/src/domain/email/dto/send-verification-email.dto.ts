import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendVerificationEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
