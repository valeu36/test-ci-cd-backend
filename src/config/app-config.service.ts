import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/** Typed accessors over the validated environment (src/config/env.validation.ts). */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get nodeEnv(): string {
    return this.config.getOrThrow<string>('NODE_ENV')
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production'
  }

  get port(): number {
    return this.config.getOrThrow<number>('PORT')
  }

  get databaseUrl(): string {
    return this.config.getOrThrow<string>('DATABASE_URL')
  }

  get corsOrigins(): string[] {
    return this.config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== '')
  }

  get swaggerEnabled(): boolean {
    return this.config.getOrThrow<boolean>('SWAGGER_ENABLED')
  }
}
