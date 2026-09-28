import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'

import { AppModule } from 'src/app/app.module'
import { configureApp } from 'src/app/configure-app'
import { buildOpenApiDocument } from 'src/app/openapi'
import { AppConfigService } from 'src/config/app-config.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Railway sends SIGTERM before replacing a deployment; this lets in-flight
  // requests and the DB pool close cleanly instead of being cut off.
  app.enableShutdownHooks()

  const configService = app.get(AppConfigService)
  configureApp(app)

  if (configService.swaggerEnabled) {
    SwaggerModule.setup('api/docs', app, buildOpenApiDocument(app))
  }

  await app.listen(configService.port)
}

void bootstrap()
