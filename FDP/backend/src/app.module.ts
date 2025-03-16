import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './domain/auth/auth.module';
import { EmailModule } from './domain/email/email.module';
import { InvitationModule } from './domain/invitation/invitation.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? path.join(__dirname, '../test/.env.test')
          : path.join(__dirname, '../../.env'),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log('Database Config:', {
          host: configService.get('DATABASE_HOST'),
          port: parseInt(configService.get('DATABASE_PORT') || '5432', 10),
          username: configService.get('DATABASE_USER'),
          database: configService.get('DATABASE_NAME'),
        });

        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: parseInt(configService.get('DATABASE_PORT') || '5432', 10),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    EmailModule,
    InvitationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
