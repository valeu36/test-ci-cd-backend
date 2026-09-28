import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus'
import { Test, TestingModule } from '@nestjs/testing'

import { HealthController } from 'src/health/controllers/health.controller'

describe('HealthController', () => {
  let controller: HealthController
  let health: { check: jest.Mock }
  let db: { pingCheck: jest.Mock }

  beforeEach(async () => {
    health = { check: jest.fn().mockResolvedValue({ status: 'ok' }) }
    db = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: TypeOrmHealthIndicator, useValue: db },
      ],
    }).compile()

    controller = module.get(HealthController)
  })

  it('runs a database ping check', async () => {
    await controller.check()

    const [[checks]] = health.check.mock.calls as [[Array<() => unknown>]]
    expect(checks).toHaveLength(1)
    await checks[0]()
    expect(db.pingCheck).toHaveBeenCalledWith('database')
  })

  it('returns the result from HealthCheckService', async () => {
    await expect(controller.check()).resolves.toEqual({ status: 'ok' })
  })
})
