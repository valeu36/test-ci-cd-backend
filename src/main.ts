import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from 'src/app/app.module'
import { configureApp } from 'src/app/configure-app'
import { AppConfigService } from 'src/config/app-config.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Railway sends SIGTERM before replacing a deployment; this lets in-flight
  // requests and the DB pool close cleanly instead of being cut off.
  app.enableShutdownHooks()

  const configService = app.get(AppConfigService)
  configureApp(app)

  if (configService.swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('API')
      .setVersion('0.0.1')
      .addBearerAuth()
      .build()
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, config),
    )
  }

  await app.listen(configService.port)
}

void bootstrap()
