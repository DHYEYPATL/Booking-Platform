import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingStatusDto {
  @ApiProperty({ description: 'The new status of the booking', enum: BookingStatus, example: BookingStatus.CONFIRMED })
  @IsEnum(BookingStatus, { message: 'Status must be a valid BookingStatus value (PENDING, CONFIRMED, CANCELLED, COMPLETED)' })
  @IsNotEmpty({ message: 'Status is required' })
  status!: BookingStatus;
}
