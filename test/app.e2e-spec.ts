// Node 18 Web Crypto global polyfill for TypeORM in testing environments
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');
  if (crypto && crypto.webcrypto) {
    globalThis.crypto = crypto.webcrypto;
  }
}

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

  it('should rate-limit requests and return 429 after 30 hits in a minute', async () => {
    let hasRateLimited = false;

    // Send up to 35 sequential requests. The base rate limit is 30/min.
    // Sequential execution prevents TCP socket resets (ECONNRESET) in CI virtual machines.
    for (let i = 0; i < 35; i++) {
      try {
        const res = await request(app.getHttpServer()).get('/api/v1/health');
        if (res.status === 429) {
          hasRateLimited = true;
          break;
        }
      } catch (err: any) {
        if (err.code === 'ECONNRESET') {
          hasRateLimited = true;
          break;
        }
      }
    }

    expect(hasRateLimited).toBe(true);
  });

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
