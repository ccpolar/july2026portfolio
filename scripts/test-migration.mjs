/**
 * Checks the Work-consolidation migration in scripts/ensure-schema.cjs before
 * it is ever pointed at the live database.
 *
 * It runs the real statements against a throwaway Postgres (PGlite, Postgres
 * compiled to WebAssembly — no server to install), on data shaped like the
 * live site's: pieces already linked to a project, pieces matched only by
 * title, the same work appearing in several portfolio sections, messy titles,
 * and two projects sharing one. Then it runs the whole thing a second time,
 * because this is part of every build and must never do its work twice.
 *
 * Not a dependency of the build, so install it when you want to run it:
 *
 *   npm i -D @electric-sql/pglite
 *   node scripts/test-migration.mjs
 */
import { PGlite } from '@electric-sql/pglite'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { STATEMENTS } = require('./ensure-schema.cjs')

const first = STATEMENTS.findIndex((s) => s.includes('enum_projects_category'))
const section = STATEMENTS.slice(first)
console.log(`Running the last ${section.length} statements (from the category enum on).\n`)

const db = new PGlite()

await db.exec(`
  CREATE TABLE "media" ("id" serial PRIMARY KEY, "url" varchar);
  CREATE TABLE "projects" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar,
    "client" varchar,
    "year" numeric,
    "summary" varchar NOT NULL,
    "cover_id" integer NOT NULL,
    "featured" boolean DEFAULT true,
    "order" numeric DEFAULT 0,
    "body" jsonb,
    "gallery_gap" numeric DEFAULT 48,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL
  );
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" ("slug");
  CREATE TABLE "branding" ("id" serial PRIMARY KEY, "title" varchar NOT NULL, "image_id" integer NOT NULL,
    "project_id" integer, "order" numeric DEFAULT 0,
    "updated_at" timestamptz DEFAULT now() NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL);
  CREATE TABLE "merchandise" ("id" serial PRIMARY KEY, "title" varchar NOT NULL, "image_id" integer NOT NULL,
    "order" numeric DEFAULT 0,
    "updated_at" timestamptz DEFAULT now() NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL);
  CREATE TABLE "advertising" ("id" serial PRIMARY KEY, "title" varchar NOT NULL, "image_id" integer NOT NULL,
    "project_id" integer, "caption" varchar, "order" numeric DEFAULT 0,
    "updated_at" timestamptz DEFAULT now() NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL);
  CREATE TABLE "websites" ("id" serial PRIMARY KEY, "title" varchar NOT NULL, "screenshot_id" integer NOT NULL,
    "live_url" varchar, "order" numeric DEFAULT 0,
    "updated_at" timestamptz DEFAULT now() NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL);

  INSERT INTO "media" ("url") SELECT 'img-' || g FROM generate_series(1, 80) g;

  INSERT INTO "projects" ("title","slug","summary","cover_id","featured","order") VALUES
    ('Dragonfly Creative','dragonfly-creative','A full identity.',1,true,0),
    ('Honest Coffee','honest-coffee','Packaging and signage.',2,true,1),
    ('Northwind Ads','northwind-ads','A spring campaign.',3,true,2),
    ('Studio Vale','studio-vale','Identity work.',4,true,3),
    ('Twin Title','twin-title','One of two.',5,true,4),
    ('Twin Title','twin-title-2','The other of two.',6,true,5);

  INSERT INTO "branding" ("title","image_id","project_id","order") VALUES
    ('Dragonfly Creative',10,1,0),
    ('Harbour & Co.',11,NULL,1),
    ('Studio Vale',12,NULL,2),
    ('  Tidewater   Supply Co!! ',13,NULL,3),
    ('Twin Title',14,NULL,4);

  INSERT INTO "advertising" ("title","image_id","project_id","caption","order") VALUES
    ('Dragonfly Creative',20,1,'Out of home',0),
    ('Northwind Ads',21,3,'Spring campaign',1),
    ('Fieldnotes Launch',22,NULL,'Three-week burst',2),
    ('Harbour & Co.',23,NULL,'Press run',3);

  INSERT INTO "websites" ("title","screenshot_id","live_url","order") VALUES
    ('Honest Coffee',30,'https://honestcoffee.example',0),
    ('Harbour & Co.',31,'https://harbour.example',1);

  INSERT INTO "merchandise" ("title","image_id","order")
    SELECT 'Merch item ' || g, 40 + g, g FROM generate_series(1, 26) g;
`)

const run = async (label) => {
  await db.exec('BEGIN')
  try {
    for (const statement of section) await db.exec(statement)
    await db.exec('COMMIT')
    console.log(`${label}: all ${section.length} statements applied.`)
  } catch (error) {
    await db.exec('ROLLBACK')
    console.error(`${label} FAILED:`, error.message)
    process.exit(1)
  }
}

const snapshot = async () =>
  (
    await db.query(`
      SELECT p.id, p.title, p.slug, p.featured, p."order", p.live_url, p.summary, p.cover_id,
             COALESCE((SELECT string_agg(c.value::text, ',' ORDER BY c."order")
                         FROM projects_category c WHERE c.parent_id = p.id), '') AS sections
        FROM projects p ORDER BY p.id`)
  ).rows

const report = async (label) => {
  const rows = await snapshot()
  console.log(`\n${label} — ${rows.length} projects`)
  console.log('   id | slug                   | feat  | ord | sections                       | live')
  for (const r of rows) {
    console.log(
      `   ${String(r.id).padStart(2)} | ${(r.slug ?? '-').padEnd(22)} | ${String(r.featured).padEnd(5)} | ${String(r.order).padStart(3)} | ${(r.sections || '-').padEnd(30)} | ${r.live_url ?? ''}`,
    )
  }
  return rows
}

await run('First build')
const after1 = await report('After the first build')
await run('\nSecond build (idempotency)')
const after2 = await report('After the second build')

const checks = []
const check = (name, pass, detail = '') => {
  checks.push(pass)
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`)
}
console.log('')
check('re-running changes nothing', JSON.stringify(after1) === JSON.stringify(after2))

const by = (slug) => after2.find((r) => r.slug === slug)
check(
  'a piece in two sections stays one project',
  by('dragonfly-creative')?.sections === 'advertising,branding',
  `dragonfly-creative sections = ${by('dragonfly-creative')?.sections}`,
)
check(
  'a title-matched piece joins the existing project',
  by('studio-vale')?.sections === 'branding' && !by('studio-vale-2'),
  by('studio-vale-2') ? 'studio-vale-2 was created' : 'no duplicate',
)
check(
  'a new piece appearing in three sections is one project',
  by('harbour-co')?.sections === 'advertising,branding,website' &&
    by('harbour-co')?.live_url === 'https://harbour.example',
  `harbour-co = ${by('harbour-co')?.sections} / ${by('harbour-co')?.live_url}`,
)
check(
  'an ambiguous title gets its own project rather than a guess',
  Boolean(by('twin-title-3')),
  by('twin-title-3') ? 'twin-title-3 created' : 'joined one of the twins',
)
check('punctuation and double spaces slugify', Boolean(by('tidewater-supply-co')))
check(
  'existing projects keep their Recent Work place',
  ['dragonfly-creative', 'honest-coffee', 'northwind-ads', 'studio-vale'].every(
    (s) => by(s)?.featured === true,
  ),
)
check(
  'moved-only pieces stay off Recent Work',
  after2
    .filter(
      (r) =>
        r.sections &&
        !['dragonfly-creative', 'honest-coffee', 'northwind-ads', 'studio-vale', 'twin-title'].includes(
          r.slug,
        ),
    )
    .every((r) => r.featured === false),
)
const counts = Object.fromEntries(
  (await db.query(`SELECT value, count(*)::int n FROM projects_category GROUP BY value`)).rows.map(
    (r) => [r.value, r.n],
  ),
)
check(
  'every source row landed in its section',
  counts.branding === 5 && counts.advertising === 4 && counts.website === 2 && counts.merchandise === 26,
  JSON.stringify(counts),
)
const moved = (await db.query(`SELECT count(*)::int n FROM portfolio_migration`)).rows[0].n
check('all 37 source rows recorded as moved', moved === 37, `${moved} rows`)
const nulls = (await db.query(`SELECT count(*)::int n FROM projects WHERE summary IS NULL`)).rows[0].n
check('summaries can now be empty', nulls > 0, `${nulls} rows with none`)

process.exit(checks.every(Boolean) ? 0 : 1)
