import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingCreatedEvent } from '../events/booking-created.event';

@Injectable()
export class BookingNotificationsListener {
  private readonly logger = new Logger('BookingNotificationsListener');

  @OnEvent('booking.created', { async: true })
  async handleBookingCreatedEvent(event: BookingCreatedEvent) {
    const { booking } = event;

    this.logger.log(
      `Asynchronously processing booking confirmation notification for: ${booking.customerEmail}`,
    );

    // Simulate sending email notification (network latency simulation of 1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    this.logger.log(
      `Booking confirmation email successfully dispatched to ${booking.customerName} (${booking.customerEmail}) for service ID: ${booking.serviceId} scheduled on ${booking.bookingDate} at ${booking.bookingTime}`,
    );
  }
}
