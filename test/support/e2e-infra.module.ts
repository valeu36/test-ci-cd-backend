import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppConfigModule } from 'src/config/app-config.module'
import { AppConfigService } from 'src/config/app-config.service'
import { typeOrmModuleOptions } from 'src/database/typeorm.config'

/** The infrastructure every e2e test server gets: config + the real database. */
@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: typeOrmModuleOptions,
    }),
  ],
})
export class E2eInfraModule {}
