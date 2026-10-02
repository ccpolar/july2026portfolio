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

  // Case-study media that isn't an image: PDFs and video files, each its own
  // library so the image collection's WebP conversion and alt-text rule don't
  // apply to them.
  `CREATE TABLE IF NOT EXISTS "documents" (
     "id" serial PRIMARY KEY NOT NULL,
     "label" varchar NOT NULL,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "url" varchar,
     "thumbnail_u_r_l" varchar,
     "filename" varchar,
     "mime_type" varchar,
     "filesize" numeric,
     "width" numeric,
     "height" numeric,
     "focal_x" numeric,
     "focal_y" numeric
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "documents_filename_idx" ON "documents" ("filename")`,
  `CREATE INDEX IF NOT EXISTS "documents_updated_at_idx" ON "documents" ("updated_at")`,
  `CREATE INDEX IF NOT EXISTS "documents_created_at_idx" ON "documents" ("created_at")`,

  `CREATE TABLE IF NOT EXISTS "videos" (
     "id" serial PRIMARY KEY NOT NULL,
     "label" varchar NOT NULL,
     "poster_id" integer,
     "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     "url" varchar,
     "thumbnail_u_r_l" varchar,
     "filename" varchar,
     "mime_type" varchar,
     "filesize" numeric,
     "width" numeric,
     "height" numeric,
     "focal_x" numeric,
     "focal_y" numeric
   )`,
  `DO $$ BEGIN
     ALTER TABLE "videos" ADD CONSTRAINT "videos_poster_id_media_id_fk"
       FOREIGN KEY ("poster_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "videos_filename_idx" ON "videos" ("filename")`,
  `CREATE INDEX IF NOT EXISTS "videos_poster_idx" ON "videos" ("poster_id")`,
  `CREATE INDEX IF NOT EXISTS "videos_updated_at_idx" ON "videos" ("updated_at")`,
  `CREATE INDEX IF NOT EXISTS "videos_created_at_idx" ON "videos" ("created_at")`,

  // Payload's document-locking table carries one column per collection.
  `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "documents_id" integer`,
  `DO $$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk"
       FOREIGN KEY ("documents_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_documents_id_idx"
     ON "payload_locked_documents_rels" ("documents_id")`,
  `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer`,
  `DO $$ BEGIN
     ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk"
       FOREIGN KEY ("videos_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_videos_id_idx"
     ON "payload_locked_documents_rels" ("videos_id")`,

  // The case-study layout builder: one table per kind of block, plus the
  // grid's own images. Generated from Payload's own schema with
  // "npm run schema:sql projects_blocks" rather than written by hand, then
  // made safe to re-run.
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_projects_blocks_image_block_width" AS ENUM('full', 'inset', 'half');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_projects_blocks_grid_block_columns" AS ENUM('2', '3', '4');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_projects_blocks_grid_block_shape" AS ENUM('natural', 'square', 'landscape', 'wide', 'portrait');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_projects_blocks_scroll_block_source" AS ENUM('image', 'pdf');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_projects_blocks_video_block_source" AS ENUM('upload', 'embed');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "projects_blocks_image_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer NOT NULL,
	"width" "enum_projects_blocks_image_block_width" DEFAULT 'full',
	"caption" varchar,
	"block_name" varchar
)`,
  `CREATE TABLE IF NOT EXISTS "projects_blocks_grid_block_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer NOT NULL,
	"caption" varchar
)`,
  `CREATE TABLE IF NOT EXISTS "projects_blocks_grid_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"columns" "enum_projects_blocks_grid_block_columns" DEFAULT '3',
	"gap" numeric DEFAULT 16,
	"shape" "enum_projects_blocks_grid_block_shape" DEFAULT 'natural',
	"block_name" varchar
)`,
  `CREATE TABLE IF NOT EXISTS "projects_blocks_scroll_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"source" "enum_projects_blocks_scroll_block_source" DEFAULT 'image',
	"image_id" integer,
	"document_id" integer,
	"height" numeric DEFAULT 560,
	"caption" varchar,
	"block_name" varchar
)`,
  `CREATE TABLE IF NOT EXISTS "projects_blocks_video_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"source" "enum_projects_blocks_video_block_source" DEFAULT 'upload',
	"video_id" integer,
	"url" varchar,
	"poster_id" integer,
	"loop" boolean DEFAULT false,
	"caption" varchar,
	"block_name" varchar
)`,
  `CREATE TABLE IF NOT EXISTS "projects_blocks_text_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"content" jsonb,
	"block_name" varchar
)`,
  `CREATE TABLE IF NOT EXISTS "projects_blocks_quote_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"quote" varchar NOT NULL,
	"attribution" varchar,
	"block_name" varchar
)`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_image_block" ADD CONSTRAINT "projects_blocks_image_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_image_block" ADD CONSTRAINT "projects_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_grid_block_items" ADD CONSTRAINT "projects_blocks_grid_block_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_grid_block_items" ADD CONSTRAINT "projects_blocks_grid_block_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_grid_block"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_grid_block" ADD CONSTRAINT "projects_blocks_grid_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_scroll_block" ADD CONSTRAINT "projects_blocks_scroll_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_scroll_block" ADD CONSTRAINT "projects_blocks_scroll_block_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_scroll_block" ADD CONSTRAINT "projects_blocks_scroll_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_video_block" ADD CONSTRAINT "projects_blocks_video_block_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_video_block" ADD CONSTRAINT "projects_blocks_video_block_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_video_block" ADD CONSTRAINT "projects_blocks_video_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_text_block" ADD CONSTRAINT "projects_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "projects_blocks_quote_block" ADD CONSTRAINT "projects_blocks_quote_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_image_block_order_idx" ON "projects_blocks_image_block" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_image_block_parent_id_idx" ON "projects_blocks_image_block" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_image_block_path_idx" ON "projects_blocks_image_block" USING btree ("_path")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_image_block_image_idx" ON "projects_blocks_image_block" USING btree ("image_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_grid_block_items_order_idx" ON "projects_blocks_grid_block_items" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_grid_block_items_parent_id_idx" ON "projects_blocks_grid_block_items" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_grid_block_items_image_idx" ON "projects_blocks_grid_block_items" USING btree ("image_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_grid_block_order_idx" ON "projects_blocks_grid_block" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_grid_block_parent_id_idx" ON "projects_blocks_grid_block" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_grid_block_path_idx" ON "projects_blocks_grid_block" USING btree ("_path")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_scroll_block_order_idx" ON "projects_blocks_scroll_block" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_scroll_block_parent_id_idx" ON "projects_blocks_scroll_block" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_scroll_block_path_idx" ON "projects_blocks_scroll_block" USING btree ("_path")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_scroll_block_image_idx" ON "projects_blocks_scroll_block" USING btree ("image_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_scroll_block_document_idx" ON "projects_blocks_scroll_block" USING btree ("document_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_video_block_order_idx" ON "projects_blocks_video_block" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_video_block_parent_id_idx" ON "projects_blocks_video_block" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_video_block_path_idx" ON "projects_blocks_video_block" USING btree ("_path")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_video_block_video_idx" ON "projects_blocks_video_block" USING btree ("video_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_video_block_poster_idx" ON "projects_blocks_video_block" USING btree ("poster_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_text_block_order_idx" ON "projects_blocks_text_block" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_text_block_parent_id_idx" ON "projects_blocks_text_block" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_text_block_path_idx" ON "projects_blocks_text_block" USING btree ("_path")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_quote_block_order_idx" ON "projects_blocks_quote_block" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_quote_block_parent_id_idx" ON "projects_blocks_quote_block" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_blocks_quote_block_path_idx" ON "projects_blocks_quote_block" USING btree ("_path")`,

  // Footer tagline, on the Contact global.
  `ALTER TABLE "contact" ADD COLUMN IF NOT EXISTS "footer_tagline" varchar
     DEFAULT 'Here to help founders reach their creative goals and fulfill their visual dreams.'`,

  // ── One Work collection ────────────────────────────────────────────────
  // The portfolio used to be four small collections of its own — branding,
  // merchandise, advertising, websites — each holding little more than a title
  // and a picture, which is why a case study could only ever be written on the
  // Recent Work side. A piece of work is now one thing wherever it appears: a
  // project, carrying the sections of the portfolio it belongs in.
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_projects_category" AS ENUM('branding', 'merchandise', 'advertising', 'website');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "projects_category" (
     "order" integer NOT NULL,
     "parent_id" integer NOT NULL,
     "value" "enum_projects_category",
     "id" serial PRIMARY KEY NOT NULL
   )`,
  `DO $$ BEGIN
     ALTER TABLE "projects_category" ADD CONSTRAINT "projects_category_parent_fk"
       FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "projects_category_order_idx" ON "projects_category" USING btree ("order")`,
  `CREATE INDEX IF NOT EXISTS "projects_category_parent_idx" ON "projects_category" USING btree ("parent_id")`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "live_url" varchar`,
  // Summary was required when every project was a full write-up. Most of the
  // merchandise coming across is a product shot with a name and nothing to
  // say. Relaxing a constraint can't lose a row, and re-running it is a no-op.
  `ALTER TABLE "projects" ALTER COLUMN "summary" DROP NOT NULL`,

  // Which portfolio row became which project. The move below reads this to
  // know what it has already done, so it can run on every build and only ever
  // do its work once. Payload doesn't know about this table; it's the
  // migration's own bookkeeping, and the record of what happened.
  `CREATE TABLE IF NOT EXISTS "portfolio_migration" (
     "source" varchar NOT NULL,
     "source_id" integer NOT NULL,
     "project_id" integer NOT NULL,
     "moved_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
     PRIMARY KEY ("source", "source_id")
   )`,

  // The move itself, row by row, because each one needs a free slug and may or
  // may not already exist as a project.
  //
  // Nothing is deleted: the four old tables stay exactly as they are, so if
  // anything about this looks wrong the originals are still there to read.
  `DO $$
   DECLARE
     src record;
     base text;
     candidate text;
     suffix int;
     target int;
     matches int;
   BEGIN
     -- A database created after the four collections were retired has none of
     -- these tables, and nothing to move. PL/pgSQL plans a statement only when
     -- it first runs, so returning here is enough — the query below is never
     -- looked at.
     IF to_regclass('public.branding') IS NULL
        OR to_regclass('public.merchandise') IS NULL
        OR to_regclass('public.advertising') IS NULL
        OR to_regclass('public.websites') IS NULL THEN
       RAISE NOTICE 'No portfolio collections to move.';
       RETURN;
     END IF;

     FOR src IN
       SELECT 'branding' AS source, 'branding' AS category, id, title,
              image_id AS cover_id, project_id,
              NULL::varchar AS caption, NULL::varchar AS live_url,
              "order", created_at, updated_at
         FROM "branding"
       UNION ALL
       SELECT 'merchandise', 'merchandise', id, title,
              image_id, NULL::integer,
              NULL::varchar, NULL::varchar,
              "order", created_at, updated_at
         FROM "merchandise"
       UNION ALL
       SELECT 'advertising', 'advertising', id, title,
              image_id, project_id,
              caption, NULL::varchar,
              "order", created_at, updated_at
         FROM "advertising"
       UNION ALL
       SELECT 'websites', 'website', id, title,
              screenshot_id, NULL::integer,
              NULL::varchar, live_url,
              "order", created_at, updated_at
         FROM "websites"
       ORDER BY source, "order", id
     LOOP
       -- Moved on an earlier build.
       IF EXISTS (
         SELECT 1 FROM "portfolio_migration"
          WHERE "source" = src.source AND "source_id" = src.id
       ) THEN
         CONTINUE;
       END IF;

       -- Same slug rule as the admin's: lowercase, punctuation dropped, spaces
       -- to hyphens. POSIX character classes, not backslash escapes, because a
       -- backslash in a JavaScript string is gone before Postgres sees it.
       base := trim(both '-' from regexp_replace(
                 regexp_replace(lower(trim(src.title)), '[^a-z0-9[:space:]-]', '', 'g'),
                 '[[:space:]_-]+', '-', 'g'));
       IF base IS NULL OR base = '' THEN
         base := src.source;
       END IF;

       -- A piece that was already pointed at a project IS that project; so is
       -- one whose title reduces to the same slug, which is how the live site
       -- already paired them up. Either way the section joins the piece that's
       -- there, rather than a second copy of the same job appearing.
       target := NULL;
       IF src.project_id IS NOT NULL THEN
         SELECT id INTO target FROM "projects" WHERE id = src.project_id;
       END IF;
       IF target IS NULL THEN
         SELECT count(*), min(id) INTO matches, target FROM "projects"
          WHERE trim(both '-' from regexp_replace(
                  regexp_replace(lower(trim(title)), '[^a-z0-9[:space:]-]', '', 'g'),
                  '[[:space:]_-]+', '-', 'g')) = base;
         -- Two projects sharing a title match neither, rather than a guess.
         IF matches <> 1 THEN
           target := NULL;
         END IF;
       END IF;

       IF target IS NULL THEN
         candidate := base;
         suffix := 1;
         WHILE EXISTS (SELECT 1 FROM "projects" WHERE "slug" = candidate) LOOP
           suffix := suffix + 1;
           candidate := base || '-' || suffix;
         END LOOP;

         -- featured false: these were on the portfolio page, never on Recent
         -- Work, and the move shouldn't put them there.
         INSERT INTO "projects"
           ("title", "slug", "live_url", "summary", "cover_id",
            "featured", "order", "created_at", "updated_at")
         VALUES
           (trim(src.title), candidate, src.live_url, src.caption, src.cover_id,
            false, src."order", src.created_at, src.updated_at)
         RETURNING id INTO target;
       ELSE
         -- Joining a project that's already there: fill its blanks, overwrite
         -- nothing it already says.
         UPDATE "projects"
            SET "live_url" = COALESCE("live_url", src.live_url),
                "summary" = COALESCE("summary", src.caption)
          WHERE id = target;
       END IF;

       IF NOT EXISTS (
         SELECT 1 FROM "projects_category"
          WHERE "parent_id" = target AND "value" = src.category::"enum_projects_category"
       ) THEN
         INSERT INTO "projects_category" ("order", "parent_id", "value")
         VALUES (
           COALESCE((SELECT max("order") FROM "projects_category" WHERE "parent_id" = target), -1) + 1,
           target,
           src.category::"enum_projects_category"
         );
       END IF;

       INSERT INTO "portfolio_migration" ("source", "source_id", "project_id")
       VALUES (src.source, src.id, target);
     END LOOP;
   END $$`,

  // ── Hero carousel ──────────────────────────────────────────────────────
  // The fan of photographs between the homepage headline and its paragraph.
  `CREATE TABLE IF NOT EXISTS "homepage_hero_cards" (
     "_order" integer NOT NULL,
     "_parent_id" integer NOT NULL,
     "id" varchar PRIMARY KEY NOT NULL,
     "image_id" integer NOT NULL
   )`,
  `DO $$ BEGIN
     ALTER TABLE "homepage_hero_cards" ADD CONSTRAINT "homepage_hero_cards_image_id_media_id_fk"
       FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "homepage_hero_cards" ADD CONSTRAINT "homepage_hero_cards_parent_id_fk"
       FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "homepage_hero_cards_order_idx" ON "homepage_hero_cards" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "homepage_hero_cards_parent_id_idx" ON "homepage_hero_cards" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "homepage_hero_cards_image_idx" ON "homepage_hero_cards" USING btree ("image_id")`,

  // ── Columns left behind by removed fields ──────────────────────────────
  // Saving a global rewrites the whole row as an INSERT ... ON CONFLICT DO
  // UPDATE, naming only the columns the current config knows about. Postgres
  // builds that row before it works out there is a conflict, so a column left
  // over from a field that no longer exists — NOT NULL, and with no default to
  // fall back on — fails the whole save. Nothing reads or writes it any more;
  // it just sits there refusing every edit.
  //
  // That is what happened to the homepage: "metaTitle" went in July and
  // "approachBody" in September, both required and neither with a default, and
  // between them they made the page unsavable with an error that says only
  // "Something went wrong".
  //
  // This clears the NOT NULL from any column on that table that no longer has
  // a field behind it. Only columns with no default can cause it, so the ones
  // still in use are named and kept; required-ness is enforced by Payload
  // before a write ever reaches here, so this loses nothing real.
  `DO $$
   DECLARE
     col record;
   BEGIN
     FOR col IN
       SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'homepage'
          AND is_nullable = 'NO'
          AND column_default IS NULL
          AND column_name NOT IN ('id', 'hero_line', 'hero_intro', 'meta_description')
     LOOP
       EXECUTE format('ALTER TABLE "homepage" ALTER COLUMN %I DROP NOT NULL', col.column_name);
       RAISE NOTICE 'homepage.%: cleared a NOT NULL left behind by a removed field', col.column_name;
     END LOOP;
   END $$`,

  // How the hero carousel is sized, on the Hero tab.
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_homepage_hero_cards_shape" AS ENUM('natural', 'square', 'portrait', 'tall');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "hero_cards_shape" "enum_homepage_hero_cards_shape" DEFAULT 'natural'`,
  `ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "hero_cards_height" numeric DEFAULT 100`,

  // Whether the grid behind the site drifts, holds still, or is there at all.
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_theme_background_grid" AS ENUM('moving', 'still', 'off');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `ALTER TABLE "theme" ADD COLUMN IF NOT EXISTS "background_grid" "enum_theme_background_grid" DEFAULT 'moving'`,

  // Whether a piece of work is live or a draft. Defaulted to 'live' so every
  // existing row keeps exactly the visibility it already has the moment this
  // runs — nothing should go dark just because the migration applied.
  `DO $$ BEGIN
     CREATE TYPE "public"."enum_projects_status" AS ENUM('live', 'draft');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "status" "enum_projects_status" DEFAULT 'live'`,

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
    // The same trap from the other direction: "\s" in a JavaScript string is
    // just "s", so a regex written here arrives at Postgres missing its
    // escapes. Use POSIX classes ([[:space:]]) instead.
    if (statement.includes('\\')) {
      throw new Error(`[schema] backslash in SQL — write it as a POSIX class: ${label}…`)
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

if (require.main === module) {
  main().catch((error) => {
    console.error('[schema] Failed:', error)
    process.exit(1)
  })
}

// So the statements can be run against a throwaway Postgres and checked —
// see scripts/test-migration.cjs.
module.exports = { STATEMENTS, validate }
