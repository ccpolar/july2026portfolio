import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Media } from './collections/Media'
import { Advertising } from './collections/portfolio/Advertising'
import { Branding } from './collections/portfolio/Branding'
import { Merchandise } from './collections/portfolio/Merchandise'
import { Websites } from './collections/portfolio/Websites'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Subscribers } from './collections/Subscribers'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { Contact } from './globals/Contact'
import { Homepage } from './globals/Homepage'
import { Identity } from './globals/Identity'
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
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: '· Cam',
    },
  },
  collections: [
    Projects,
    Branding,
    Merchandise,
    Advertising,
    Websites,
    Posts,
    Testimonials,
    Media,
    Subscribers,
    Users,
  ],
  globals: [Homepage, Contact, Theme, Identity],
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
      collections: { media: true },
      token: blobToken,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
  telemetry: false,
})
