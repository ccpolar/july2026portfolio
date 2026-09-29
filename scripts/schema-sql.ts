import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import config from '@payload-config'
import {
  generateDrizzleJson,
  generateMigration,
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from 'drizzle-kit/api'

/**
 * Prints the Postgres SQL for the whole schema, as Payload would create it.
 *
 * Production runs Postgres while development runs SQLite, so the statements in
 * scripts/ensure-schema.cjs have always been written by hand and only really
 * tested by deploying. This removes the guesswork: the adapter builds its
 * Drizzle tables during init — before it connects to anything — and
 * drizzle-kit turns that into DDL offline. Nothing here touches a database.
 *
 *   npm run schema:sql                      # every table, as Postgres
 *   npm run schema:sql projects_blocks      # only matching tables
 *   npm run schema:sql projects_blocks sqlite   # the same, for local SQLite
 *
 * Copy what's new into ensure-schema.cjs, adding IF NOT EXISTS so it stays
 * safe to re-run on every build.
 */
const run = async () => {
  const sanitized = await config

  // A stand-in for the payload instance: init only reads the config and logs.
  const payload = {
    config: sanitized,
    collections: Object.fromEntries(
      sanitized.collections.map((collection) => [collection.slug, { config: collection }]),
    ),
    globals: { config: sanitized.globals },
    logger: console,
  }

  const filter = process.argv[2]
  // Production is Postgres; local development is SQLite. Both can be printed
  // from the same config, which is how the two stay in step.
  const dialect = process.argv[3] === 'sqlite' ? 'sqlite' : 'postgres'

  // The adapter factories hand back { defaultIDType, init }, where init is the
  // factory that takes the payload instance.
  const { init: createAdapter } =
    dialect === 'sqlite'
      ? sqliteAdapter({ client: { url: 'file:./never-connects.db' } })
      : postgresAdapter({ pool: { connectionString: 'postgres://schema-dump/never-connects' } })
  const adapter = createAdapter({ payload: payload as never })

  // init() builds the Drizzle tables from the config. It's optional on the
  // adapter type, but every adapter that can describe a schema has it.
  await (adapter.init as () => Promise<void>)()

  const [toJson, toMigration] = (
    dialect === 'sqlite'
      ? [generateSQLiteDrizzleJson, generateSQLiteMigration]
      : [generateDrizzleJson, generateMigration]
  ) as [(schema: unknown) => Promise<unknown>, (from: unknown, to: unknown) => Promise<string[]>]

  const empty = await toJson({})
  const current = await toJson({ ...adapter.tables, ...(adapter.enums ?? {}) })
  const statements: string[] = await toMigration(empty, current)

  const wanted = filter ? statements.filter((s) => s.includes(filter)) : statements

  console.log(
    `-- ${dialect}: ${wanted.length} of ${statements.length} statements${filter ? ` matching "${filter}"` : ''}`,
  )
  for (const statement of wanted) console.log(`${statement.trim()}\n`)
  process.exit(0)
}

await run()
