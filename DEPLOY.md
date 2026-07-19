# Deploying to Vercel

The code is deploy-ready. This is the account-side checklist. You have Vercel;
you still need a Postgres database. Your current content is already exported into
`backups/content-export/` and will be migrated in Step 6.

Three things differ from local dev, all handled below:
- **Database** — local SQLite → cloud Postgres (the app switches automatically).
- **Images** — local `media/` folder → Vercel Blob (uploads vanish on redeploy
  without it).
- **Content** — the production database starts empty; Step 6 fills it.

---

## 1. Put the code on GitHub

Vercel deploys from a Git repo.

```bash
git add -A
git commit -m "Portfolio ready to deploy"
git remote add origin <your-github-repo-url>
git push -u origin main
```

`.env`, `portfolio.db`, `media/`, and `backups/` are gitignored — none of your
secrets or local data get pushed.

## 2. Create a Postgres database

Any provider works. **Neon** (neon.tech) has a generous free tier and pairs
cleanly with Vercel. Create a database and copy its **connection string** — it
looks like `postgres://user:pass@host/dbname?sslmode=require`.

## 3. Import the repo into Vercel

Vercel → **Add New → Project** → import your GitHub repo. It auto-detects Next.js;
don't change the build settings. **Don't deploy yet** — set env vars first
(Step 5).

## 4. Connect a Blob store (for images)

In the Vercel project: **Storage → Create → Blob**. This automatically adds a
`BLOB_READ_WRITE_TOKEN` env var to the project. That's all it takes — uploads
will now persist.

## 5. Set environment variables

Vercel → project → **Settings → Environment Variables**. Add:

| Name | Value |
| --- | --- |
| `DATABASE_URI` | your Postgres connection string from Step 2 |
| `PAYLOAD_SECRET` | a long random string — generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SERVER_URL` | your site URL, e.g. `https://your-site.vercel.app` (update after the first deploy tells you the real domain) |

`BLOB_READ_WRITE_TOKEN` is already there from Step 4. Then **Deploy**.

**The first deploy will fail**, with an error like `relation "projects" does not
exist`. This is expected — Payload only auto-creates its database tables when
`NODE_ENV` isn't `production`, and Vercel always builds with `NODE_ENV=production`,
so the schema never gets created there. Step 6 fixes this (it creates the schema
as a side effect of running from your own machine, where `NODE_ENV` isn't set).
Once Step 6 is done, redeploy from **Deployments → ⋯ → Redeploy** and it will
succeed.

## 6. Migrate your content (this also creates the database schema)

This moves your projects, testimonials, theme, and images into the live database
and Blob store — and, because it runs on your machine rather than on Vercel, it's
also what actually creates the tables in Postgres. Run it **once, from your
machine**, pointed at production. In a terminal in the project folder
(PowerShell shown; use real values):

```powershell
$env:DATABASE_URI="postgres://...your Neon string..."
$env:BLOB_READ_WRITE_TOKEN="vercel_blob_rw_...from Vercel Storage tab..."
$env:PAYLOAD_SECRET="...the same secret you set in Vercel..."
npm run migrate:import
```

It re-uploads all 35 images to Blob and recreates your 4 projects, 2
testimonials, and theme with the relationships re-linked. It refuses to run if
the target already has content (so you can't double-import by accident).

To refresh the bundle first (if you've edited content locally since the backup):
`npm run migrate:export`.

## 7. Create your admin login on the live site

Visit `https://your-site.vercel.app/admin`. Because the production database has
no users yet, it shows a **create-first-user** screen. Make your account there.
(Logins are deliberately not migrated — password hashes shouldn't be copied
between environments.)

## 8. Check it

- The homepage shows your work with images loading.
- `/admin` lets you edit; saving updates the live site.
- Upload a test image on a project to confirm Blob storage works, then delete it.

---

## Notes

- **Schema sync only runs outside production** (`push: true` in the Postgres
  config, but Payload disables `push` whenever `NODE_ENV=production` — which
  Vercel always sets). `migrate:import` created the schema as a side effect of
  running from your own machine. If you later add or change a field on a
  collection/global, Vercel's build will **not** update the live table — sync
  it yourself first, from your machine, pointed at production:
  ```powershell
  $env:DATABASE_URI="postgres://...prod..."
  $env:PAYLOAD_SECRET="...same secret..."
  npm run migrate:sync-schema
  ```
  Then redeploy. This only alters the schema, not your data. For stricter
  control later (real up/down migration files, reviewed before running),
  switch to Payload's formal migration workflow.
- **Custom domain**: add it under Vercel → Settings → Domains, then update
  `NEXT_PUBLIC_SERVER_URL` to match and redeploy.
- **Backups**: your snapshot lives in `backups/`. Re-run `npm run migrate:export`
  any time to capture the current local content.
