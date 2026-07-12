import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';
import { BookingStatus } from '../entities/booking.entity';

export class QueryBookingDto extends PaginationDto {
  @ApiProperty({ description: 'Filter bookings by status', enum: BookingStatus, required: false })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiProperty({ description: 'Search term matching customer name, email, or phone', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
