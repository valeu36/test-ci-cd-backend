import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppConfigModule } from 'src/config/app-config.module'
import { AppConfigService } from 'src/config/app-config.service'
import { typeOrmModuleOptions } from 'src/database/typeorm.config'
import { HealthModule } from 'src/health/health.module'

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: typeOrmModuleOptions,
    }),
    HealthModule,
  ],
})
export class AppModule {}
