import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT!),
        secure: true,
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASSWORD!,
        },
      },
      defaults: {
        from: '"FDP Team" <no-reply@fdp.com>',
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
