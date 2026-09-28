import { DataSource } from 'typeorm'

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  const tableNames = dataSource.entityMetadatas.map(
    (metadata) => `"${metadata.tableName}"`,
  )

  if (tableNames.length === 0) {
    return
  }

  await dataSource.query(`TRUNCATE ${tableNames.join(', ')} CASCADE`)
}
