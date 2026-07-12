import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { Service } from './entities/service.entity';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Service successfully created.',
    type: Service,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createServiceDto: CreateServiceDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.servicesService.create(createServiceDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of services returned with pagination.',
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.servicesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Service details.', type: Service })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Service successfully updated.',
    type: Service,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    return this.servicesService.update(id, updateServiceDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service (Admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Service successfully soft-deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete service with active bookings.',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const userId = req.user?.sub;
    return this.servicesService.remove(id, userId);
  }
}
