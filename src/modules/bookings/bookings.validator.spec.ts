import { BookingsValidator } from './bookings.validator';
import { BookingStatus } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { AppException, ErrorCode } from '../../common/exceptions/app.exception';

describe('BookingsValidator', () => {
  let validator: BookingsValidator;

  beforeEach(() => {
    validator = new BookingsValidator();
  });

  describe('validateFutureDate', () => {
    it('should pass for future dates', () => {
      expect(() => validator.validateFutureDate('2030-01-01', '12:00')).not.toThrow();
    });

    it('should throw AppException (PAST_DATE) for past dates', () => {
      expect(() => validator.validateFutureDate('2020-01-01', '12:00')).toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.PAST_DATE,
        })
      );
    });

    it('should validate time if the date is today', () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const localTodayStr = `${yyyy}-${mm}-${dd}`;

      // A time in the past for today
      expect(() => validator.validateFutureDate(localTodayStr, '00:00')).toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.PAST_DATE,
        })
      );
    });
  });

  describe('validateServiceAvailability', () => {
    it('should throw AppException (SERVICE_NOT_FOUND) if service is null', () => {
      expect(() => validator.validateServiceAvailability(null, 'uuid')).toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.SERVICE_NOT_FOUND,
        })
      );
    });

    it('should throw AppException (INACTIVE_SERVICE) if service is inactive', () => {
      const service = { id: 'uuid', isActive: false, title: 'Test Service' } as Service;
      expect(() => validator.validateServiceAvailability(service, 'uuid')).toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.INACTIVE_SERVICE,
        })
      );
    });

    it('should pass if service exists and is active', () => {
      const service = { id: 'uuid', isActive: true, title: 'Test Service' } as Service;
      expect(() => validator.validateServiceAvailability(service, 'uuid')).not.toThrow();
    });
  });

  describe('validateStatusTransition', () => {
    it('should throw AppException (INVALID_STATUS_TRANSITION) when transition is from CANCELLED to COMPLETED', () => {
      expect(() =>
        validator.validateStatusTransition(BookingStatus.CANCELLED, BookingStatus.COMPLETED)
      ).toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.INVALID_STATUS_TRANSITION,
        })
      );
    });

    it('should throw AppException (INVALID_STATUS_TRANSITION) when modifying a COMPLETED booking', () => {
      expect(() =>
        validator.validateStatusTransition(BookingStatus.COMPLETED, BookingStatus.CONFIRMED)
      ).toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.INVALID_STATUS_TRANSITION,
        })
      );
    });

    it('should pass for valid status transitions', () => {
      expect(() =>
        validator.validateStatusTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED)
      ).not.toThrow();
    });
  });

  describe('validateCancellation', () => {
    it('should throw AppException (INVALID_STATUS_TRANSITION) when cancelling a COMPLETED booking', () => {
      expect(() => validator.validateCancellation(BookingStatus.COMPLETED)).toThrow(
        expect.objectContaining({
          errorCode: ErrorCode.INVALID_STATUS_TRANSITION,
        })
      );
    });

    it('should pass when cancelling a PENDING or CONFIRMED booking', () => {
      expect(() => validator.validateCancellation(BookingStatus.PENDING)).not.toThrow();
      expect(() => validator.validateCancellation(BookingStatus.CONFIRMED)).not.toThrow();
    });
  });
});
