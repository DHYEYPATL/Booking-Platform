import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status', () => {
      const health = appController.getHealth();
      expect(health).toHaveProperty('status');
      expect(health.status).toBe('healthy');
      expect(health).toHaveProperty('name', 'Booking Platform REST API');
    });
  });
});
