import { IsString, IsNotEmpty, IsEmail, IsUUID, Matches, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'The customer\'s full name', example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName!: string;

  @ApiProperty({ description: 'The customer\'s email address', example: 'jane.doe@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Customer email is required' })
  customerEmail!: string;

  @ApiProperty({ description: 'The customer\'s phone number', example: '+1234567890' })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone number is required' })
  customerPhone!: string;

  @ApiProperty({ description: 'The UUID of the service to book', example: 'f8d3876e-3467-425b-ae0e-7440e2cfdb84' })
  @IsUUID('4', { message: 'Service ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId!: string;

  @ApiProperty({ description: 'The date of the booking (format: YYYY-MM-DD)', example: '2026-07-15' })
  @IsString()
  @IsNotEmpty({ message: 'Booking date is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Booking date must be in YYYY-MM-DD format' })
  bookingDate!: string;

  @ApiProperty({ description: 'The time of the booking (format: HH:MM in 24-hour style)', example: '14:30' })
  @IsString()
  @IsNotEmpty({ message: 'Booking time is required' })
  @Matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Booking time must be in HH:MM format' })
  bookingTime!: string;

  @ApiProperty({ description: 'Optional notes or special requests', example: 'Looking forward to the cut.', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
