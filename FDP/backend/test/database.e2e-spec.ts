import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './../src/app.module';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

describe('Database Connection (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let configService: ConfigService;

  beforeAll(async () => {
    jest.setTimeout(120000);
    try {
      console.log('Starting database connection test...');
      console.log('Current NODE_ENV:', process.env.NODE_ENV);

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      configService = app.get(ConfigService);

      // 환경 변수 로깅
      console.log('Database Configuration:', {
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        database: configService.get('DATABASE_NAME'),
        envFile:
          process.env.NODE_ENV === 'test' ? '../test/.env.test' : '../../.env',
      });

      await app.init();

      dataSource = app.get(DataSource);

      // 데이터베이스 연결 상태 로깅
      console.log('Database Connection Status:', {
        isInitialized: dataSource.isInitialized,
        options: {
          type: dataSource.options.type,
          schema: (dataSource.options as PostgresConnectionOptions).schema,
          database: dataSource.options.database,
        },
      });

      try {
        await dataSource.query('SELECT 1');
        console.log('Database query successful');
      } catch (error) {
        const err = error as Error & {
          code?: string;
          errno?: number;
          syscall?: string;
          address?: string;
          port?: number;
        };

        console.error('Database query failed:', {
          name: err.name || 'Unknown',
          message: err.message || 'No message',
          code: err.code,
          errno: err.errno,
          syscall: err.syscall,
          address: err.address,
          port: err.port,
          stack: err.stack,
        });
      }
    } catch (error) {
      const err = error as Error;

      console.error('Setup failed:', {
        name: err.name || 'Unknown',
        message: err.message || 'No message',
        stack: err.stack,
      });
      throw error;
    }
  });

  it('should connect to database', async () => {
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBeTruthy();

    const result = await dataSource.query('SELECT 1 as number');
    expect(result[0].number).toBe(1);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });
});
