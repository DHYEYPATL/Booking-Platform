import { Injectable, HttpStatus } from '@nestjs/common';
import { Service } from '@modules/services/entities/service.entity';
import { BookingStatus } from './entities/booking.entity';
import { AppException, ErrorCode } from '@common/exceptions/app.exception';

@Injectable()
export class BookingsValidator {
  /**
   * Validates that the booking date and time are not in the past.
   */
  validateFutureDate(bookingDate: string, bookingTime: string): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const localTodayStr = `${yyyy}-${mm}-${dd}`;

    if (bookingDate < localTodayStr) {
      throw new AppException('Booking date cannot be in the past', ErrorCode.PAST_DATE, HttpStatus.BAD_REQUEST);
    }

    if (bookingDate === localTodayStr) {
      const nowTime = today.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
      if (bookingTime < nowTime) {
        throw new AppException('Booking time cannot be in the past', ErrorCode.PAST_DATE, HttpStatus.BAD_REQUEST);
      }
    }
  }

  /**
   * Validates that the booked service exists and is active.
   */
  validateServiceAvailability(service: Service | null, serviceId: string): void {
    if (!service) {
      throw new AppException(`Service with ID "${serviceId}" not found`, ErrorCode.SERVICE_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (!service.isActive) {
      throw new AppException(`Service "${service.title}" is currently inactive and cannot be booked`, ErrorCode.INACTIVE_SERVICE, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validates state transitions for booking status updates.
   */
  validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    // Cancelled bookings cannot be marked as completed
    if (currentStatus === BookingStatus.CANCELLED && newStatus === BookingStatus.COMPLETED) {
      throw new AppException('Cancelled bookings cannot be marked as completed', ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST);
    }

    // Completed bookings cannot be modified to other states
    if (currentStatus === BookingStatus.COMPLETED && newStatus !== BookingStatus.COMPLETED) {
      throw new AppException('Completed bookings cannot be modified or updated', ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validates cancellation eligibility.
   */
  validateCancellation(currentStatus: BookingStatus): void {
    if (currentStatus === BookingStatus.COMPLETED) {
      throw new AppException('Completed bookings cannot be cancelled', ErrorCode.INVALID_STATUS_TRANSITION, HttpStatus.BAD_REQUEST);
    }
  }
}
