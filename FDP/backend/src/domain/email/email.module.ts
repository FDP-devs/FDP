import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from './email-verification.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EmailVerification]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('SMTP_USER:', configService.get('SMTP_USER'));

        return {
          transport: {
            service: 'gmail',
            host: configService.get('SMTP_HOST'),
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
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
