import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppConfigService } from 'src/config/app-config.service'
import { envValidationSchema } from 'src/config/env.validation'

const nodeEnv = process.env.NODE_ENV ?? 'development'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Real environment variables win over both files, so a deployed instance
      // (Railway injects everything as env vars) never reads a file at all.
      envFilePath: [`.env.${nodeEnv}`, '.env'],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
