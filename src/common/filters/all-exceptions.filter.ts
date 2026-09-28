import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

import { Request, Response } from 'express'

/**
 * The one error envelope every endpoint answers with:
 *
 *   { statusCode, error, message, path, timestamp, ...extra }
 *
 * An HttpException keeps whatever body it was thrown with — ValidationPipe's
 * `message: string[]`, terminus's `{ status, info, error, details }` — and
 * only gains `path` and `timestamp`, so callers never lose detail. Anything
 * else is a bug: it is logged with its stack and answered as a bare 500, so
 * internals never reach the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()

    const context = { path: request.url, timestamp: new Date().toISOString() }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const body = exception.getResponse()

      response.status(statusCode).json({
        statusCode,
        error: HttpStatus[statusCode] ?? 'Error',
        ...(typeof body === 'string' ? { message: body } : body),
        ...context,
      })
      return
    }

    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    )

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
      ...context,
    })
  }
}
