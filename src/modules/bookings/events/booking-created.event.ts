import { Booking } from '../entities/booking.entity';

export class BookingCreatedEvent {
  constructor(public readonly booking: Booking) {}
}
