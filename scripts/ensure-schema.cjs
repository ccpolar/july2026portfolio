/**
 * Brings the live database's shape up to date, as part of the build.
 *
 * Payload creates tables and columns for you automatically, but only outside
 * production — the check is hard-coded in the adapter, and its interactive
 * "is this table renamed or new?" prompts could never run in a build anyway.
 * So every new field used to mean running a sync by hand against production
 * with the connection string in your shell.
 *
 * This runs instead, on Vercel, where DATABASE_URI is already in the build
 * environment: no credential to copy, nothing to remember, and a deploy that
 * carries its own schema change with it.
 *
 * The rules that keep it safe to run on every single build:
 *   - additive only — CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
 *     Nothing here drops, renames, or rewrites anything, so it can't lose data
 *     and re-running it does nothing.
 *   - one transaction — a half-applied schema never reaches the live site.
 *   - no-ops off Postgres, so local SQLite development is untouched (Payload
 *     still syncs that itself).
 */
const { Client } = require('pg')

/**
 * Additive statements, oldest first. Add to the end when a collection or field
 * is added; never edit or remove what's already here — older entries are what
 * bring a database created before the change up to date.
 */
const STATEMENTS = [
  // Snippets — screengrabs with a note, shown on /snippets.
  `CREATE TABLE IF NOT EXISTS "snippets" (
     "id" serial PRIMARY KEY NOT NULL,
     "title" varchar NOT NULL,
     "image_id" integer,
     "note" varchar,
     "order" numeric DEFAULT 0,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
   )`,
  `DO $$ BEGIN
     ALTER TABLE "snippets" ADD CONSTRAINT "snippets_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "snippets_image_idx" ON "snippets" ("image_id")`,
  `CREATE INDEX IF NOT EXISTS "snippets_updated_at_idx" ON "snippets" ("updated_at")`,
  `CREATE INDEX IF NOT EXISTS "snippets_created_at_idx" ON "snippets" ("created_at")`,
  // Payload's document-locking table carries one column per collection.
  `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "snippets_id" integer`,
  `DO $$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_snippets_fk"
       FOREIGN KEY ("snippets_id") REFERENCES "snippets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_snippets_id_idx"
     ON "payload_locked_documents_rels" ("snippets_id")`,

  // Legal pages — Terms of Service and Privacy Policy, one global.
  `CREATE TABLE IF NOT EXISTS "legal" (
     "id" serial PRIMARY KEY NOT NULL,
     "terms" jsonb,
     "privacy" jsonb,
     "updated_at" timestamp(3) with time zone,
     "created_at" timestamp(3) with time zone
   )`,

  // Services: "Show on the site". Existing rows take the default, so every
  // service that was already there stays visible.
  `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "published" boolean DEFAULT true`,

  // Advertising pieces can link to a Recent Work project, as branding does,
  // so a campaign's thumbnail opens its case study.
  `ALTER TABLE "advertising" ADD COLUMN IF NOT EXISTS "project_id" integer`,
  `DO $$ BEGIN
     ALTER TABLE "advertising" ADD CONSTRAINT "advertising_project_id_projects_id_fk"
       FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "advertising_project_idx" ON "advertising" ("project_id")`,

  // The portfolio page's heading and intro, editable on the Homepage global.
  `ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "portfolio_heading" varchar DEFAULT 'Portfolio'`,
  // With the default, Postgres backfills the row that's already there, so
  // the line the page shipped with survives and arrives in the admin ready to
  // edit rather than the page quietly losing it.
  `ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "portfolio_intro" varchar
     DEFAULT 'Everything, sorted by what it is — branding, merchandise, advertising, and the web.'`,

  // Footer tagline, on the Contact global.
  `ALTER TABLE "contact" ADD COLUMN IF NOT EXISTS "footer_tagline" varchar
     DEFAULT 'Here to help founders reach their creative goals and fulfill their visual dreams.'`,
]

/**
 * A read-through of the statements before any database is touched, and on
 * every build rather than only the ones that reach Postgres.
 *
 * Off Postgres the rest of this script does nothing, so a malformed statement
 * used to sail through a local build and fail on Vercel instead. The case that
 * caught us: a dollar-quoted block that arrived as `DO $ BEGIN`, because "$$"
 * in a JavaScript replacement string means one literal "$".
 */
const validate = () => {
  for (const statement of STATEMENTS) {
    const label = statement.trim().split('\n')[0].slice(0, 60)
    const runs = statement.match(/\$+/g) || []
    for (const run of runs) {
      if (run.length !== 2) {
        throw new Error(`[schema] "${run}" should be a doubled dollar quote: ${label}…`)
      }
    }
    if (runs.length % 2 !== 0) {
      throw new Error(`[schema] unclosed dollar-quoted block: ${label}…`)
    }
  }
}

const main = async () => {
  // Before the Postgres check, so a local build catches a malformed statement
  // rather than leaving it for the deploy to find.
  validate()

  const uri = process.env.DATABASE_URI || ''
  if (!/^postgres(ql)?:\/\//.test(uri)) {
    console.log('[schema] Not Postgres — skipping (Payload syncs the local database itself).')
    return
  }

  const client = new Client({ connectionString: uri })
  await client.connect()
  try {
    await client.query('BEGIN')
    for (const statement of STATEMENTS) await client.query(statement)
    await client.query('COMMIT')
    console.log(`[schema] Up to date (${STATEMENTS.length} statements checked).`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('[schema] Failed:', error)
  process.exit(1)
})
