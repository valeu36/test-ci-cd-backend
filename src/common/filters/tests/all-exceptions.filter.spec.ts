import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'

import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter'

type Captured = { status?: number; body?: Record<string, unknown> }

function hostFor(captured: Captured): ArgumentsHost {
  const response = {
    status(code: number) {
      captured.status = code
      return this
    },
    json(body: Record<string, unknown>) {
      captured.body = body
      return this
    },
  }
  const request = { method: 'GET', url: '/api/v1/things' }

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter()
  let logError: jest.SpyInstance

  beforeEach(() => {
    logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('wraps an HttpException in the envelope', () => {
    const captured: Captured = {}

    filter.catch(new NotFoundException('No such thing'), hostFor(captured))

    expect(captured.status).toBe(404)
    expect(captured.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'No such thing',
      path: '/api/v1/things',
    })
    expect(typeof captured.body?.timestamp).toBe('string')
  })

  it("keeps ValidationPipe's list of messages", () => {
    const captured: Captured = {}

    filter.catch(
      new BadRequestException(['name must be a string']),
      hostFor(captured),
    )

    expect(captured.status).toBe(400)
    expect(captured.body).toMatchObject({
      statusCode: 400,
      message: ['name must be a string'],
    })
  })

  it("keeps a custom body such as terminus's health report", () => {
    const captured: Captured = {}
    const report = {
      status: 'error',
      error: { database: { status: 'down' } },
    }

    filter.catch(new ServiceUnavailableException(report), hostFor(captured))

    expect(captured.status).toBe(503)
    expect(captured.body).toMatchObject({ statusCode: 503, ...report })
  })

  it('answers anything else as a bare 500 and logs it', () => {
    const captured: Captured = {}

    filter.catch(new Error('db password is hunter2'), hostFor(captured))

    expect(captured.status).toBe(500)
    expect(captured.body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
    })
    expect(JSON.stringify(captured.body)).not.toContain('hunter2')
    expect(logError).toHaveBeenCalled()
  })
})
