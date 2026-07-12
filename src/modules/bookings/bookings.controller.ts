import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (Public)' })
  @ApiResponse({ status: 201, description: 'Booking successfully created.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or business rule violation.',
  })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  @ApiResponse({ status: 409, description: 'Double booking detected.' })
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all bookings with filters & search (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of bookings returned with pagination.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Query() queryBookingDto: QueryBookingDto) {
    return this.bookingsService.findAll(queryBookingDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a booking by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Booking details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a booking status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Booking status successfully updated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking (Public - e.g., for customers)' })
  @ApiResponse({ status: 200, description: 'Booking successfully cancelled.' })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel a completed booking.',
  })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.cancel(id);
  }
}
