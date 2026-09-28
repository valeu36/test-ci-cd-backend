import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'

/**
 * The API's OpenAPI document — served at /api/docs by main.ts, and written to
 * openapi.json by scripts/generate-openapi.ts, which is what the frontend
 * generates its client from. One builder, so the two can never disagree.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build()

  return SwaggerModule.createDocument(app, config, {
    // `HealthController.check` → `healthCheck`, which the frontend client
    // turns into `healthCheck()` / `useHealthCheck()`. Nest's default
    // (`HealthController_check`) reads badly once generated.
    operationIdFactory: (controllerKey, methodKey) =>
      controllerKey
        .replace(/Controller$/, '')
        .replace(/^./, (c) => c.toLowerCase()) +
      methodKey.replace(/^./, (c) => c.toUpperCase()),
  })
}
