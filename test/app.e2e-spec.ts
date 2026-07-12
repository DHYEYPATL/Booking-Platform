// Set environment variables for E2E test database isolation
process.env.DB_TYPE = 'better-sqlite3';
process.env.DB_DATABASE = 'test-app.sqlite';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); // Match main.ts configuration
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('info');
        expect(res.body.info).toHaveProperty('database');
        expect(res.body.info.database).toHaveProperty('status', 'up');
        expect(res.headers).toHaveProperty('x-request-id');
      });
  });

  it('should rate-limit requests and return 429 after 60 hits in a minute', async () => {
    // Send 65 concurrent requests to trigger rate limit (configured for max 60/min)
    const requests = Array.from({ length: 65 }).map(() =>
      request(app.getHttpServer()).get('/api/v1/health')
    );
    
    const responses = await Promise.all(requests);
    const hasRateLimited = responses.some((res) => res.status === 429);
    
    expect(hasRateLimited).toBe(true);
  }, 10000); // Set timeout of 10s for concurrent test calls

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    // Clean up test database file
    const dbPath = path.join(process.cwd(), 'test-app.sqlite');
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch {
      // Ignore cleanup error if already removed
    }
  });
});
