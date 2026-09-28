import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { AppConfigService } from 'src/config/app-config.service'

/**
 * Everything the HTTP surface needs beyond module wiring: route shape
 * (/api/v1/...), CORS and validation.
 *
 * Called from BOTH main.ts and test/support/test-server.ts so e2e tests
 * exercise the exact bootstrap production runs — keep it free of anything
 * environment-specific (Swagger and listen() stay in main.ts).
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(AppConfigService)

  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

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
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
}
