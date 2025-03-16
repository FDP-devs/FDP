import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

describe('Database Connection (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    jest.setTimeout(120000);
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      dataSource = app.get(DataSource);

      console.log('Database connection details:', {
        isInitialized: dataSource.isInitialized,
        database: dataSource.options.database,
        type: dataSource.options.type,
      });

      try {
        await dataSource.query('SELECT 1');
        console.log('Database query successful');
      } catch (error: unknown) {
        console.error('Database query failed:', error);
      }
    } catch (error: unknown) {
      console.error('Setup failed:', {
        // message: error.message,
        // stack: error.stack,
        // cause: error.cause,
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
