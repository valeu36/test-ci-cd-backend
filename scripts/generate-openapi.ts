/**
 * Writes the API's OpenAPI document to openapi.json at the repo root — the
 * contract the frontend generates its client from (its `npm run api:generate`).
 *
 * Nest runs in PREVIEW mode: the module graph is scanned for routes and
 * decorators, but no provider is instantiated, so no database connection is
 * opened. AppModule's config schema still requires DATABASE_URL, so the npm
 * script (`openapi:generate`) supplies a placeholder when none is set.
 *
 * CI regenerates the file and fails if it differs from the committed copy
 * (`npm run openapi:check`), so an API change cannot merge without it.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { NestFactory } from '@nestjs/core'

import { AppModule } from 'src/app/app.module'
import { configureRoutes } from 'src/app/configure-app'
import { buildOpenApiDocument } from 'src/app/openapi'

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  })
  configureRoutes(app)

  const document = buildOpenApiDocument(app)
  const target = join(__dirname, '..', 'openapi.json')
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`)

  await app.close()
  console.log(`Wrote ${target}`)
}

void generate()
