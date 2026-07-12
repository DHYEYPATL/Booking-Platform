// Set environment variables for E2E test database isolation
process.env.DB_TYPE = 'better-sqlite3';
process.env.DB_DATABASE = 'test-booking-flow.sqlite';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './../src/app.module';

describe('Booking Platform Flow (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let refreshToken: string;
  let serviceId: string;
  let bookingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    // Clean up test database file
    const dbPath = path.join(process.cwd(), 'test-booking-flow.sqlite');
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch {
      // Ignore cleanup error
    }
  });

  describe('1. Authentication Flow', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should login and return access & refresh tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(testUser)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('userId');
          token = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });
  });

  describe('2. Service Management Flow', () => {
    it('should deny service creation without auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .send({
          title: 'Hair Cut & Style',
          description: 'Standard hair cut.',
          duration: 30,
          price: 25.0,
        })
        .expect(401);
    });

    it('should allow service creation with auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Premium Styling',
          description: 'Wash, cut, style, and massage.',
          duration: 60,
          price: 55.0,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'Premium Styling');
          expect(res.body.price).toBe(55.0);
          serviceId = res.body.id;
        });
    });

    it('should return services list publicly', () => {
      return request(app.getHttpServer())
        .get('/api/v1/services')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('3. Booking Management Flow', () => {
    const bookingDetails = {
      customerName: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      customerPhone: '555-0199',
      serviceId: '', // populated in test
      bookingDate: '2026-08-10',
      bookingTime: '14:30',
      notes: 'Please wash with warm water.',
    };

    it('should create a booking publicly without auth', () => {
      bookingDetails.serviceId = serviceId;

      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send(bookingDetails)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('customerName', 'Alice Johnson');
          expect(res.body).toHaveProperty('status', 'PENDING');
          bookingId = res.body.id;
        });
    });

    it('should prevent duplicate bookings for same service, date, and time', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send(bookingDetails)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('errorCode', 'ERR_DUPLICATE_BOOKING');
        });
    });

    it('should allow customer to cancel booking publicly', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'CANCELLED');
        });
    });

    it('should block setting a CANCELLED booking to COMPLETED', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' })
        .expect(400); // BadRequestException
    });
  });

  describe('4. Token Refresh and Logout Flow', () => {
    it('should rotation-refresh access token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          token = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should successfully logout', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
