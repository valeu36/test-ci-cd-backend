import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { type Express } from 'express'
import helmet from 'helmet'

import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter'
import { AppConfigService } from 'src/config/app-config.service'

/**
 * The route shape clients see: /api/v1/... Split out because the OpenAPI
 * generator (scripts/generate-openapi.ts) needs the same paths but runs Nest in
 * preview mode, where no provider — AppConfigService included — exists.
 */
export function configureRoutes(app: INestApplication): void {
  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })
}

/**
 * Everything the HTTP surface needs beyond module wiring: route shape, proxy
 * trust, security headers, CORS, validation and the error envelope.
 *
 * Called from BOTH main.ts and test/support/test-server.ts so e2e tests
 * exercise the exact bootstrap production runs — keep it free of anything
 * environment-specific (Swagger and listen() stay in main.ts).
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(AppConfigService)

  configureRoutes(app)

  // Railway (like any hosted platform) sits a proxy in front of the app, so
  // without this `req.ip` is the proxy's address — and anything keyed on the
  // client (rate limits, audit logs) sees one shared caller.
  const trustProxy = configService.trustProxy
  if (trustProxy !== false) {
    // HttpServer declares getInstance() as `any` — type it at this boundary.
    const expressApp = app.getHttpAdapter().getInstance() as Express
    expressApp.set('trust proxy', trustProxy)
  }

  app.use(helmet())

  const corsOrigins = configService.corsOrigins
  if (corsOrigins.length > 0) {
    // maxAge because the SPA is on its own origin, so every call with an
    // `Authorization` header preflights; without it each request pays for two
    // round trips.
    app.enableCors({ origin: corsOrigins, credentials: true, maxAge: 600 })
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
}
