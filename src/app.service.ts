import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      name: 'Booking Platform REST API',
      version: '1.0.0',
    };
  }
}
