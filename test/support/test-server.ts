import { Server } from 'node:http'

import {
  INestApplication,
  InjectionToken,
  ModuleMetadata,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getDataSourceToken } from '@nestjs/typeorm'

import { DataSource } from 'typeorm'

import { configureApp } from 'src/app/configure-app'

import { E2eInfraModule } from 'test/support/e2e-infra.module'
import { resetDatabase } from 'test/support/reset-database'

export type ProviderOverride = {
  token: InjectionToken
  useValue: unknown
}

export type CreateTestServerOptions = {
  imports?: NonNullable<ModuleMetadata['imports']>
  overrides?: ProviderOverride[]
}

export class TestServer {
  private constructor(
    private readonly moduleRef: TestingModule,
    private readonly app: INestApplication,
  ) {}

  public static async start(
    options: CreateTestServerOptions = {},
  ): Promise<TestServer> {
    let builder = Test.createTestingModule({
      imports: [E2eInfraModule, ...(options.imports ?? [])],
    })

    for (const override of options.overrides ?? []) {
      builder = builder
        .overrideProvider(override.token)
        .useValue(override.useValue)
    }

    const moduleRef = await builder.compile()
    const app = moduleRef.createNestApplication()

    // Same bootstrap as production (prefix, versioning, pipes) so e2e requests
    // hit the routes real clients see.
    configureApp(app)

    await app.init()
    // Bind to a real (ephemeral) port up front. supertest only auto-binds —
    // and auto-closes — a server it finds not yet listening, so concurrent
    // requests against an unbound one race to close it (ECONNRESET).
    await app.listen(0)

    return new TestServer(moduleRef, app)
  }

  // getHttpServer() is typed `any` by Nest — pin it to the real runtime type.
  public httpServer(): Server {
    return this.app.getHttpServer() as Server
  }

  public resolve<T>(token: InjectionToken): T {
    return this.moduleRef.get<T>(token)
  }

  public async resetDatabase(): Promise<void> {
    const dataSource = this.moduleRef.get<DataSource>(getDataSourceToken())
    await resetDatabase(dataSource)
  }

  public async stop(): Promise<void> {
    await this.resetDatabase()
    await this.app.close()

    jest.clearAllMocks()
  }
}
