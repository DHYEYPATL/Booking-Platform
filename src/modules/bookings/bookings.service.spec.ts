import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingsValidator } from './bookings.validator';
import { AppException, ErrorCode } from '../../common/exceptions/app.exception';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let serviceRepository: jest.Mocked<Repository<Service>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockBookingRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  const mockServiceRepository = () => ({
    findOne: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        BookingsValidator,
        {
          provide: getRepositoryToken(Booking),
          useFactory: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useFactory: mockServiceRepository,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get(getRepositoryToken(Booking));
    serviceRepository = module.get(getRepositoryToken(Service));
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockServiceId = 'service-uuid';
    const mockDto = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '1234567890',
      serviceId: mockServiceId,
      bookingDate: '2026-08-01',
      bookingTime: '10:00',
      notes: 'No notes',
    };

    it('should throw AppException (SERVICE_NOT_FOUND) if service does not exist', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      try {
        await service.create(mockDto);
        fail('Expected AppException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.SERVICE_NOT_FOUND);
      }
    });

    it('should throw AppException (INACTIVE_SERVICE) if service is inactive', async () => {
      const mockService = {
        id: mockServiceId,
        isActive: false,
        title: 'Test Service',
      } as Service;
      serviceRepository.findOne.mockResolvedValue(mockService);

      try {
        await service.create(mockDto);
        fail('Expected AppException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.INACTIVE_SERVICE);
      }
    });

    it('should throw AppException (PAST_DATE) if booking date is in the past', async () => {
      const mockService = {
        id: mockServiceId,
        isActive: true,
        title: 'Test Service',
      } as Service;
      serviceRepository.findOne.mockResolvedValue(mockService);

      const pastDto = { ...mockDto, bookingDate: '2020-01-01' };

      try {
        await service.create(pastDto);
        fail('Expected AppException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.PAST_DATE);
      }
    });

    it('should throw AppException (DUPLICATE_BOOKING) if duplicate booking exists', async () => {
      const mockService = {
        id: mockServiceId,
        isActive: true,
        title: 'Test Service',
      } as Service;
      serviceRepository.findOne.mockResolvedValue(mockService);
      bookingRepository.findOne.mockResolvedValue({
        id: 'existing-booking-id',
      } as Booking);

      try {
        await service.create(mockDto);
        fail('Expected AppException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.DUPLICATE_BOOKING);
      }
    });

    it('should successfully create a booking', async () => {
      const mockService = {
        id: mockServiceId,
        isActive: true,
        title: 'Test Service',
      } as Service;
      serviceRepository.findOne.mockResolvedValue(mockService);
      bookingRepository.findOne.mockResolvedValue(null);

      const mockCreatedBooking = {
        ...mockDto,
        id: 'booking-uuid',
        status: BookingStatus.PENDING,
      } as Booking;
      bookingRepository.create.mockReturnValue(mockCreatedBooking);
      bookingRepository.save.mockResolvedValue(mockCreatedBooking);

      const result = await service.create(mockDto);
      expect(result).toEqual(mockCreatedBooking);
      expect(bookingRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'booking.created',
        expect.any(Object),
      );
    });
  });

  describe('updateStatus', () => {
    it('should throw AppException (INVALID_STATUS_TRANSITION) when trying to change CANCELLED booking to COMPLETED', async () => {
      const mockBooking = {
        id: 'booking-uuid',
        status: BookingStatus.CANCELLED,
      } as Booking;
      bookingRepository.findOne.mockResolvedValue(mockBooking);

      try {
        await service.updateStatus('booking-uuid', {
          status: BookingStatus.COMPLETED,
        });
        fail('Expected AppException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.INVALID_STATUS_TRANSITION);
      }
    });

    it('should throw AppException (INVALID_STATUS_TRANSITION) when trying to modify COMPLETED booking', async () => {
      const mockBooking = {
        id: 'booking-uuid',
        status: BookingStatus.COMPLETED,
      } as Booking;
      bookingRepository.findOne.mockResolvedValue(mockBooking);

      try {
        await service.updateStatus('booking-uuid', {
          status: BookingStatus.CONFIRMED,
        });
        fail('Expected AppException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.INVALID_STATUS_TRANSITION);
      }
    });

    it('should successfully update status', async () => {
      const mockBooking = {
        id: 'booking-uuid',
        status: BookingStatus.PENDING,
      } as Booking;
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      bookingRepository.save.mockImplementation(async (b: any) => b);

      const result = await service.updateStatus('booking-uuid', {
        status: BookingStatus.CONFIRMED,
      });
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('cancel', () => {
    it('should throw AppException (INVALID_STATUS_TRANSITION) when trying to cancel COMPLETED booking', async () => {
      const mockBooking = {
        id: 'booking-uuid',
        status: BookingStatus.COMPLETED,
      } as Booking;
      bookingRepository.findOne.mockResolvedValue(mockBooking);

      try {
        await service.cancel('booking-uuid');
        fail('Expected AppException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.INVALID_STATUS_TRANSITION);
      }
    });

    it('should return same booking if already CANCELLED', async () => {
      const mockBooking = {
        id: 'booking-uuid',
        status: BookingStatus.CANCELLED,
      } as Booking;
      bookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.cancel('booking-uuid');
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingRepository.save).not.toHaveBeenCalled();
    });

    it('should cancel booking and save', async () => {
      const mockBooking = {
        id: 'booking-uuid',
        status: BookingStatus.PENDING,
      } as Booking;
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      bookingRepository.save.mockImplementation(async (b: any) => b);

      const result = await service.cancel('booking-uuid');
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingRepository.save).toHaveBeenCalled();
    });
  });
});
