import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailVerification } from './email-verification.entity';

const logger = new Logger('EmailModule');

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('SMTP_HOST');
        const port = configService.get('SMTP_PORT');
        const user = configService.get('SMTP_USER');
        const pass = configService.get('SMTP_PASSWORD');

        logger.log(`SMTP Config: {
          host: ${host},
          port: ${port},
          user: ${user},
          pass: ${pass ? '******' + pass.slice(-4) : 'not set'}
        }`);

        return {
          transport: {
            host,
            port: parseInt(port || '587'),
            secure: false,
            auth: {
              user,
              pass,
            },
            tls: {
              rejectUnauthorized: false,
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
