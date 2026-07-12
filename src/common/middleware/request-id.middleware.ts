import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { als } from '../logger/als';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate UUID if not present in request headers
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    
    // Set headers on response
    res.setHeader('x-request-id', requestId);

    // Propagate the correlation ID through ALS
    als.run({ requestId }, () => {
      next();
    });
  }
}
