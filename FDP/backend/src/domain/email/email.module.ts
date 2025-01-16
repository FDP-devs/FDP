import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('SMTP_USER:', configService.get('SMTP_USER'));

        return {
          transport: {
            service: 'gmail',
            host: configService.get('SMTP_HOST'),
            // secure: true 일 때는 포트가 명시적으로 정해져있음
            port: configService.get('SMTP_PORT'),
            secure: true,
            auth: {
              user: configService.get('SMTP_USER'),
              pass: configService.get('SMTP_PASSWORD'),
            },
          },
          defaults: {
            from: '"FDP Team" <no-reply@fdp.com>',
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
