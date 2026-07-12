import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  PAST_DATE = 'ERR_PAST_DATE',
  DUPLICATE_BOOKING = 'ERR_DUPLICATE_BOOKING',
  INACTIVE_SERVICE = 'ERR_INACTIVE_SERVICE',
  INVALID_STATUS_TRANSITION = 'ERR_INVALID_STATUS_TRANSITION',
  SERVICE_NOT_FOUND = 'ERR_SERVICE_NOT_FOUND',
  BOOKING_NOT_FOUND = 'ERR_BOOKING_NOT_FOUND',
  VALIDATION_ERROR = 'ERR_VALIDATION_ERROR',
}

export class AppException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: ErrorCode,
    statusCode: HttpStatus,
    public readonly errors?: any[],
  ) {
    super(
      {
        message,
        errorCode,
        ...(errors ? { errors } : {}),
      },
      statusCode
    );
  }
}
