import request from 'supertest'

import { HealthModule } from 'src/health/health.module'

import { TestServer } from 'test/support/test-server'

describe('Health (e2e)', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await TestServer.start({ imports: [HealthModule] })
  })

  afterEach(async () => {
    await server.stop()
  })

  it('/api/v1/health (GET) reports the database as up', async () => {
    await request(server.httpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          status: 'ok',
          info: { database: { status: 'up' } },
        })
      })
  })
})
