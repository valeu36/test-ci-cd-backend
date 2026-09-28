import request from 'supertest'

import { HealthModule } from 'src/health/health.module'

import { TestServer } from 'test/support/test-server'

describe('HTTP surface (e2e)', () => {
  let server: TestServer

  beforeEach(async () => {
    server = await TestServer.start({ imports: [HealthModule] })
  })

  afterEach(async () => {
    await server.stop()
  })

  it('answers an unknown route with the error envelope', async () => {
    const res = await request(server.httpServer())
      .get('/api/v1/no-such-route')
      .expect(404)

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/api/v1/no-such-route',
    })
    expect(typeof (res.body as { timestamp: unknown }).timestamp).toBe('string')
  })

  it('sends helmet security headers', async () => {
    const res = await request(server.httpServer())
      .get('/api/v1/health')
      .expect(200)

    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
