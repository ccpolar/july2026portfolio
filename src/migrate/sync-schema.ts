import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Syncs the database schema to match the current collections/globals — adds or
 * alters tables/columns, touches no data. Payload only does this automatically
 * when NODE_ENV isn't 'production', which Vercel's build always is, so the live
 * schema has to be synced by running this from your own machine instead.
 *
 * Usage (PowerShell), after editing a collection or global:
 *   $env:DATABASE_URI="postgres://...production connection string..."
 *   $env:PAYLOAD_SECRET="...same secret set in Vercel..."
 *   npm run migrate:sync-schema
 * Then redeploy on Vercel so the running app matches the new schema.
 */
const run = async () => {
  const payload = await getPayload({ config })
  payload.logger.info('Schema sync complete.')
  process.exit(0)
}

await run()
