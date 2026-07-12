import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@modules/auth/auth.module';
import { ServicesModule } from '@modules/services/services.module';
import { BookingsModule } from '@modules/bookings/bookings.module';
import { HealthModule } from '@modules/health/health.module';
import { User } from '@modules/auth/entities/user.entity';
import { Service } from '@modules/services/entities/service.entity';
import { Booking } from '@modules/bookings/entities/booking.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestIdMiddleware } from '@common/middleware/request-id.middleware';
import { CustomThrottlerGuard } from '@common/guards/custom-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = (configService.get<string>('DB_TYPE') || 'postgres') as 'postgres' | 'better-sqlite3';

        return dbType === 'better-sqlite3'
          ? {
              type: 'better-sqlite3',
              database: configService.get<string>('DB_DATABASE') || 'database.sqlite',
              entities: [User, Service, Booking],
              synchronize: true, // Auto-schema update for SQLite local development/testing
              logging: false,
            }
          : {
              type: 'postgres',
              host: configService.get<string>('DB_HOST') || 'localhost',
              port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
              username: configService.get<string>('DB_USERNAME') || 'postgres',
              password: configService.get<string>('DB_PASSWORD') || 'postgres',
              database: configService.get<string>('DB_DATABASE') || 'booking_platform',
              entities: [User, Service, Booking],
              synchronize: false, // Prod/Postgres always requires migrations
              migrationsRun: true, // Runs migrations automatically on app start in PostgreSQL mode
              logging: true,
            };
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 30,  // Base limit of 30, overridden dynamically by CustomThrottlerGuard
      },
    ]),
    EventEmitterModule.forRoot(), // Enable NestJS Event Emitter module globally
    AuthModule,
    ServicesModule,
    BookingsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // Apply our custom dynamic rate-limiter guard globally
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request correlation ID middleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
