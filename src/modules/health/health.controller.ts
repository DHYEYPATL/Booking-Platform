import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Run system health checks (Database & Memory)' })
  @ApiResponse({ status: 200, description: 'Service is healthy.' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy.' })
  check() {
    return this.health.check([
      // Verify database connectivity
      () => this.db.pingCheck('database'),
      // Verify memory footprint (heap limit 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
