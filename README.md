# Cam — portfolio

A custom Next.js site with [Payload CMS](https://payloadcms.com) in the same codebase. Every word,
image and colour on the site is editable at `/admin`; nothing the design surfaces is hardcoded.

## Running it

```bash
npm install
npm run seed    # demo content + admin user (safe to re-run; it clears first)
npm run dev
```

- Site — http://localhost:3000
- Admin — http://localhost:3000/admin

The seed creates `cam@polarcreativegroup.com` / `changeme-please`. **Change it in /admin.** Set
`SEED_ADMIN_PASSWORD` before seeding anything reachable from the internet.

## What you can edit, and where

| In /admin | Controls |
| --- | --- |
| **Site → Homepage** | Hero line, intro, availability dot, section headings, the three approach points, SEO title/description |
| **Site → Contact** | Email (the primary CTA), booking link, newsletter blurb, social links |
| **Site → Theme** | Brand colour, signal colour, corner radius |
| **Content → Projects** | Each homepage row + its own `/work/<slug>` page. `order` sets the sequence; untick `featured` to hide |
| **Content → Testimonials** | Quotes. Untick `published` on all of them and the section disappears rather than showing an empty shell |
| **Content → Subscribers** | Newsletter sign-ups |

Saving anything triggers an on-demand revalidate, so the change is live immediately — the pages are
prerendered but never stale.

### About the theme colours

Colours are stored as OKLCH components (lightness / chroma / hue) rather than hex, and the inputs are
range-capped. That is deliberate: it means you can move the brand colour anywhere around the wheel and
white button text stays readable. `src/lib/theme.ts` re-clamps on read, so a bad value written straight
to the database still cannot produce an unreadable page.

Hue 110 is the olive it ships with. Try 30 for clay, 250 for ink blue. Chroma above ~0.07 at a dark
lightness leaves the range screens can display and the colour goes muddy — low values are what keep it
reading muted rather than acid.

## Database

Local dev runs on **SQLite** (`portfolio.db`) so it boots with nothing to install.

`src/payload.config.ts` picks the adapter from `DATABASE_URI`: a `postgres://` or `postgresql://` URL
uses the Postgres adapter, anything else falls back to SQLite.

### Deploying to Vercel

1. Create a Postgres database (Vercel Postgres or Neon — the free tier is plenty).
2. Set env vars on the project: `DATABASE_URI` (the Postgres URL), `PAYLOAD_SECRET`,
   `NEXT_PUBLIC_SERVER_URL`.
3. Deploy. Payload creates the schema on first boot.
4. Seed or re-enter content against the new database, then change the admin password.

**Uploads need object storage before you go live.** Media currently writes to the local `media/`
directory, and Vercel's filesystem is ephemeral — uploaded images would vanish on redeploy. Add
`@payloadcms/storage-vercel-blob` (or S3/R2) as part of the deploy step.

## Checking your work

```bash
node scripts/shoot.mjs   # screenshots every breakpoint; fails loudly on console
                         # errors, broken images, or horizontal overflow
```

It scrolls each page before capturing so lazy-loaded images actually commit — without that it reports
a clean run against images that never loaded.

## Design

`PRODUCT.md` holds the strategy, `DESIGN.md` the visual system. The short version: pure white surface,
one deep olive brand colour spent almost entirely on the closing section, one bright signal reserved
for the availability dot, and a single typeface (Archivo) whose width axis carries the display voice so
the page never needs a second family.
