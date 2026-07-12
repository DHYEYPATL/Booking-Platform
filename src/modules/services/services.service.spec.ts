import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { CacheService } from '@common/cache/cache.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let serviceRepository: jest.Mocked<Repository<Service>>;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let cacheService: jest.Mocked<CacheService>;

  const mockServiceRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    merge: jest.fn(),
    softRemove: jest.fn(),
  });

  const mockBookingRepository = () => ({
    findOne: jest.fn(),
  });

  const mockCacheService = () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useFactory: mockServiceRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useFactory: mockBookingRepository,
        },
        {
          provide: CacheService,
          useFactory: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    serviceRepository = module.get(getRepositoryToken(Service));
    bookingRepository = module.get(getRepositoryToken(Booking));
    cacheService = module.get(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create and save a service', async () => {
      const dto = {
        title: 'Premium Haircut',
        description: 'Includes wash',
        duration: 45,
        price: 50.0,
      };
      const savedService = {
        id: 'service-uuid',
        ...dto,
        isActive: true,
      } as Service;

      serviceRepository.create.mockReturnValue(savedService);
      serviceRepository.save.mockResolvedValue(savedService);

      const result = await service.create(dto, 'admin-uuid');
      expect(result).toEqual(savedService);
      expect(serviceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ ...dto, createdBy: 'admin-uuid' }),
      );
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return cached services if available', async () => {
      const cached = {
        data: [{ id: '1', title: 'Cached' } as Service],
        total: 1,
      };
      cacheService.get.mockReturnValue(cached);

      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result.data).toEqual(cached.data);
      expect(result.total).toBe(1);
      expect(serviceRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if not cached', async () => {
      cacheService.get.mockReturnValue(null);
      const services = [{ id: '1', title: 'DB Service' }] as Service[];
      serviceRepository.findAndCount.mockResolvedValue([services, 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result.data).toEqual(services);
      expect(cacheService.set).toHaveBeenCalledWith(
        'services:limit=10:offset=0',
        { data: services, total: 1 },
        300000,
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if service not found', async () => {
      serviceRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return service by ID', async () => {
      const mockService = { id: 'service-uuid', title: 'A Service' } as Service;
      serviceRepository.findOne.mockResolvedValue(mockService);

      const result = await service.findOne('service-uuid');
      expect(result).toEqual(mockService);
    });
  });

  describe('update', () => {
    it('should update and save the service', async () => {
      const mockService = { id: 'service-uuid', title: 'A Service' } as Service;
      const updateDto = { title: 'Updated Title' };
      const mergedService = {
        ...mockService,
        ...updateDto,
        updatedBy: 'admin-uuid',
      } as Service;

      serviceRepository.findOne.mockResolvedValue(mockService);
      serviceRepository.merge.mockReturnValue(mergedService);
      serviceRepository.save.mockResolvedValue(mergedService);

      const result = await service.update(
        'service-uuid',
        updateDto,
        'admin-uuid',
      );
      expect(result.title).toBe('Updated Title');
      expect(serviceRepository.save).toHaveBeenCalledWith(mergedService);
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException if active bookings exist', async () => {
      const mockService = { id: 'service-uuid', title: 'A Service' } as Service;
      serviceRepository.findOne.mockResolvedValue(mockService);
      bookingRepository.findOne.mockResolvedValue({
        id: 'booking-id',
      } as Booking);

      await expect(service.remove('service-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should soft delete the service if no active bookings exist', async () => {
      const mockService = { id: 'service-uuid', title: 'A Service' } as Service;
      serviceRepository.findOne.mockResolvedValue(mockService);
      bookingRepository.findOne.mockResolvedValue(null);

      await service.remove('service-uuid', 'admin-uuid');
      expect(serviceRepository.save).toHaveBeenCalled();
      expect(serviceRepository.softRemove).toHaveBeenCalledWith(mockService);
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });
});
