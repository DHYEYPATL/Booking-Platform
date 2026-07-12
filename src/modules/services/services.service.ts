import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { CacheService } from '@common/cache/cache.service';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly cacheService: CacheService,
  ) {}

  async create(createServiceDto: CreateServiceDto, userId?: string): Promise<Service> {
    const service = this.serviceRepository.create({
      ...createServiceDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.serviceRepository.save(service);
    
    // Invalidate public service cache
    this.cacheService.clear();
    
    return saved;
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, offset } = paginationDto;
    
    // Generate unique cache key based on pagination limits
    const cacheKey = `services:limit=${limit}:offset=${offset}`;
    const cachedData = this.cacheService.get<{ data: Service[]; total: number }>(cacheKey);

    if (cachedData) {
      return {
        ...cachedData,
        limit,
        offset,
      };
    }

    const [data, total] = await this.serviceRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    const result = { data, total };
    
    // Cache the list of active services for 5 minutes (300,000 ms)
    this.cacheService.set(cacheKey, result, 300000);

    return {
      ...result,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto, userId?: string): Promise<Service> {
    const service = await this.findOne(id);
    
    const updated = this.serviceRepository.merge(service, {
      ...updateServiceDto,
      updatedBy: userId,
    });

    const saved = await this.serviceRepository.save(updated);
    
    // Invalidate public service cache
    this.cacheService.clear();
    
    return saved;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const service = await this.findOne(id);

    // Business Rule Check: Verify if there are any active bookings for this service
    const activeBooking = await this.bookingRepository.findOne({
      where: {
        serviceId: id,
        status: Not(BookingStatus.CANCELLED),
      },
    });

    if (activeBooking) {
      throw new BadRequestException(
        'Cannot delete this service because it has active bookings associated with it. You can set isActive to false to disable it instead.'
      );
    }

    // Set auditing field before deletion
    if (userId) {
      service.updatedBy = userId;
      await this.serviceRepository.save(service);
    }
    
    // Execute soft delete
    await this.serviceRepository.softRemove(service);
    
    // Invalidate public service cache
    this.cacheService.clear();
  }
}
