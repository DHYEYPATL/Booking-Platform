import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { CacheService } from '@common/cache/cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Booking])],
  controllers: [ServicesController],
  providers: [ServicesService, CacheService],
  exports: [ServicesService, TypeOrmModule, CacheService],
})
export class ServicesModule {}
