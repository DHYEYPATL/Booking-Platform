import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1712345678901 implements MigrationInterface {
  name = 'InitialSchema1712345678901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "currentRefreshTokenHash" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "UQ_97672ac88f789774dd47f0c8d3d" UNIQUE ("email"),
        CONSTRAINT "PK_a3c91c5c5cfe9619b58abb71e54" PRIMARY KEY ("id")
      )
    `);

    // Create services table
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "duration" integer NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "createdBy" character varying,
        "updatedBy" character varying,
        CONSTRAINT "PK_c66c39ea4df0689b1da99d9b047" PRIMARY KEY ("id")
      )
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customerName" character varying NOT NULL,
        "customerEmail" character varying NOT NULL,
        "customerPhone" character varying NOT NULL,
        "serviceId" uuid NOT NULL,
        "bookingDate" date NOT NULL,
        "bookingTime" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "createdBy" character varying,
        "updatedBy" character varying,
        CONSTRAINT "PK_bee6805982cc1e248e94bd94957" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_service" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT
      )
    `);

    // Create partial unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_booking_service_date_time_unique" 
      ON "bookings" ("serviceId", "bookingDate", "bookingTime") 
      WHERE "status" != 'CANCELLED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_booking_service_date_time_unique"`,
    );
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
