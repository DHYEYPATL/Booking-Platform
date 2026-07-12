import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../modules/auth/entities/user.entity';
import { Service } from '../modules/services/entities/service.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';

dotenv.config();

const dbType = (process.env.DB_TYPE || 'postgres') as
  'postgres' | 'better-sqlite3';

export const AppDataSource = new DataSource(
  dbType === 'better-sqlite3'
    ? {
        type: 'better-sqlite3',
        database: process.env.DB_DATABASE || 'database.sqlite',
        entities: [User, Service, Booking],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: true,
        logging: true,
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'booking_platform',
        entities: [User, Service, Booking],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: true,
      },
);
