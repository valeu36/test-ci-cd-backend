import 'reflect-metadata'

import { config as loadEnv } from 'dotenv'
import { DataSource, DataSourceOptions } from 'typeorm'

// The TypeORM CLI entry point (migration:run / generate / revert). It runs
// outside Nest, so it loads the same env files AppConfigModule does, in the
// same order. On Railway neither file exists and DATABASE_URL comes from the
// environment.
const nodeEnv = process.env.NODE_ENV ?? 'development'
loadEnv({ path: `.env.${nodeEnv}`, quiet: true })
loadEnv({ path: '.env', quiet: true })

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
}

export default new DataSource(dataSourceOptions)
