import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsValidator } from './bookings.validator';
import { BookingNotificationsListener } from './listeners/booking-notifications.listener';
import { ServicesModule } from '@modules/services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    ServicesModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsValidator, BookingNotificationsListener],
  exports: [BookingsService, BookingsValidator],
})
export class BookingsModule {}
