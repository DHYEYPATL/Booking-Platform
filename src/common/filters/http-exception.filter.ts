import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errorCode: string | undefined = undefined;
    let errors: any[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).errorCode;
        errors = (exceptionResponse as any).errors;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      const err = exception as any;
      
      // PostgreSQL unique constraint violation error code
      if (err.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'A duplicate record already exists in the database.';
        errorCode = 'ERR_DUPLICATE_RECORD';
      } else if (err.code === 'SQLITE_CONSTRAINT') {
        status = HttpStatus.CONFLICT;
        message = 'A database constraint was violated (e.g. duplicate booking or field validation conflict).';
        errorCode = 'ERR_DATABASE_CONSTRAINT';
      } else {
        message = exception.message;
      }
    }

    // Log the error details internally
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ErrorCode: ${errorCode || 'NONE'} - Error: ${
        typeof message === 'object' ? JSON.stringify(message) : message
      }`
    );

    // Send formatted JSON error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errorCode ? { errorCode } : {}),
      ...(errors ? { errors } : {}),
    });
  }
}
