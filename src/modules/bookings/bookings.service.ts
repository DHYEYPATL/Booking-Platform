import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { Service } from '@modules/services/entities/service.entity';
import { BookingsValidator } from './bookings.validator';
import { AppException, ErrorCode } from '@common/exceptions/app.exception';
import { BookingCreatedEvent } from './events/booking-created.event';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly bookingsValidator: BookingsValidator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { serviceId, bookingDate, bookingTime } = createBookingDto;

    // 1. Verify that the service exists and is active
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    this.bookingsValidator.validateServiceAvailability(service, serviceId);

    // 2. Validate that the booking date and time is not in the past
    this.bookingsValidator.validateFutureDate(bookingDate, bookingTime);

    // 3. Prevent duplicate bookings (same service, date, time) where status !== CANCELLED
    const duplicate = await this.bookingRepository.findOne({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: Not(BookingStatus.CANCELLED),
      },
    });

    if (duplicate) {
      throw new AppException(
        `This service is already booked for ${bookingDate} at ${bookingTime}. Please choose another time slot.`,
        ErrorCode.DUPLICATE_BOOKING,
        HttpStatus.CONFLICT,
      );
    }

    // 4. Create and save booking
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      status: BookingStatus.PENDING,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // 5. Emit BookingCreatedEvent asynchronously for processing notifications/emails
    this.eventEmitter.emit(
      'booking.created',
      new BookingCreatedEvent(savedBooking),
    );

    return savedBooking;
  }

  async findAll(queryBookingDto: QueryBookingDto) {
    const { limit, offset, status, search } = queryBookingDto;

    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service');

    if (status) {
      query.andWhere('booking.status = :status', { status });
    }

    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(booking.customerName) LIKE :search OR LOWER(booking.customerEmail) LIKE :search OR LOWER(booking.customerPhone) LIKE :search)',
        { search: searchPattern },
      );
    }

    query
      .orderBy('booking.bookingDate', 'DESC')
      .addOrderBy('booking.bookingTime', 'DESC')
      .take(limit)
      .skip(offset);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: { service: true },
    });

    if (!booking) {
      throw new AppException(
        `Booking with ID "${id}" not found`,
        ErrorCode.BOOKING_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const { status: newStatus } = updateBookingStatusDto;
    const booking = await this.findOne(id);

    this.bookingsValidator.validateStatusTransition(booking.status, newStatus);

    booking.status = newStatus;
    return this.bookingRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      return booking; // Already cancelled
    }

    this.bookingsValidator.validateCancellation(booking.status);

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}
