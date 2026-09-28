import { TypeOrmModuleOptions } from '@nestjs/typeorm'

import { AppConfigService } from 'src/config/app-config.service'

export function typeOrmModuleOptions(
  configService: AppConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: configService.databaseUrl,
    entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    // Schema changes go through migrations only — run as Railway's pre-deploy
    // command in production, `migration:run:*` everywhere else.
    synchronize: false,
  }
}
