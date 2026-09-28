import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  /**
   * Liveness/readiness — Railway's healthcheck path (railway.json) points here,
   * so a new deployment only takes traffic once it can reach its database.
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.db.pingCheck('database')])
  }
}
