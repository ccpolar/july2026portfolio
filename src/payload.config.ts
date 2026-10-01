import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Clients } from './collections/Clients'
import { Documents } from './collections/Documents'
import { Media } from './collections/Media'
import { Moodboard } from './collections/Moodboard'
import { Posts } from './collections/Posts'
import { Services } from './collections/Services'
import { Snippets } from './collections/Snippets'
import { Projects } from './collections/Projects'
import { Subscribers } from './collections/Subscribers'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { Contact } from './globals/Contact'
import { Homepage } from './globals/Homepage'
import { Identity } from './globals/Identity'
import { Legal } from './globals/Legal'
import { LoadingScreen } from './globals/LoadingScreen'
import { Theme } from './globals/Theme'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseURI = process.env.DATABASE_URI || 'file:./portfolio.db'

// Local development runs on SQLite so the site boots with no database to install.
// Production (Vercel) sets DATABASE_URI to a Postgres connection string and the
// Postgres adapter takes over — same schema, same collections.
const isPostgres = /^postgres(ql)?:\/\//.test(databaseURI)

// Vercel's filesystem is ephemeral, so uploaded images can't live on disk in
// production. When BLOB_READ_WRITE_TOKEN is present (set automatically on
// Vercel once a Blob store is connected) media is stored in Vercel Blob;
// without it the plugin disables itself and uploads fall back to the local
// `media/` folder — so local development is completely unaffected.
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

export default buildConfig({
  admin: {
    user: Users.slug,
    // Local convenience only: lets the admin be opened without a password
    // while working on it. Gated twice — the flag has to be set *and* the
    // build has to be a development one — so it can never apply on Vercel,
    // which always builds with NODE_ENV=production.
    ...(process.env.NODE_ENV !== 'production' && process.env.ADMIN_AUTOLOGIN === 'true'
      ? { autoLogin: { email: process.env.ADMIN_AUTOLOGIN_EMAIL || '' } }
      : {}),
    importMap: { baseDir: path.resolve(dirname) },
    // The landing page: what's on the site and the way back in, instead of
    // Payload's tile per collection.
    dashboard: {
      widgets: [
        {
          slug: 'overview',
          label: 'Overview',
          Component: '/components/admin/DashboardOverview#DashboardOverview',
          minWidth: 'full',
        },
      ],
      defaultLayout: [{ widgetSlug: 'overview', width: 'full' }],
    },
    meta: {
      titleSuffix: '· Cam',
    },
  },
  collections: [
    Projects,
    Moodboard,
    Snippets,
    Posts,
    Testimonials,
    Services,
    Clients,
    Media,
    Documents,
    Videos,
    Subscribers,
    Users,
  ],
  globals: [Homepage, Contact, Theme, Identity, LoadingScreen, Legal],
  editor: lexicalEditor(),
  db: isPostgres
    ? postgresAdapter({
        pool: { connectionString: databaseURI },
        // Auto-sync the schema on connect. Payload turns this off in production
        // by default (expecting a migration workflow); for a single-owner site
        // that rarely changes shape, letting the schema create itself on first
        // boot is the simpler, reliable path. See DEPLOY.md.
        push: true,
      })
    : sqliteAdapter({ client: { url: databaseURI } }),
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(blobToken),
      collections: { media: true, documents: true, videos: true },
      token: blobToken,
      // Upload straight from the browser to Blob storage instead of through the
      // serverless function. That's the only way past Vercel's hard 4.5 MB
      // request-body limit, so large source files can be uploaded. Trade-off:
      // the server never sees the bytes, so Payload can't generate the resized
      // WebP variants — client-uploaded images are stored and served at their
      // original resolution (MediaImage falls back to the original URL when no
      // sizes exist). Export images at a sensible size to keep pages light.
      clientUploads: true,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
  telemetry: false,
})
