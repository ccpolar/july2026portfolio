import config from '@payload-config'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'

/**
 * Exports all site content to a portable bundle so it can be re-created in a
 * fresh production database + Vercel Blob store.
 *
 * Reads the local database (whatever DATABASE_URI points at) and writes:
 *   backups/content-export/content.json   — every doc, media referenced by id
 *   backups/content-export/media/<file>   — the original uploaded images
 *
 * Read-only against the source — it never modifies the database it reads.
 * Re-run any time to refresh the bundle; import.ts consumes it.
 */

const OUT = path.resolve(process.cwd(), 'backups/content-export')
const MEDIA_SRC = path.resolve(process.cwd(), 'media')

const run = async () => {
  const payload = await getPayload({ config })

  const all = async (collection: 'projects' | 'posts' | 'testimonials' | 'media') => {
    const { docs } = await payload.find({ collection, depth: 0, limit: 1000, pagination: false })
    return docs
  }

  const [projects, posts, testimonials, media] = await Promise.all([
    all('projects'),
    all('posts'),
    all('testimonials'),
    all('media'),
  ])

  const [homepage, contact, theme, identity] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', depth: 0 }),
    payload.findGlobal({ slug: 'contact', depth: 0 }),
    payload.findGlobal({ slug: 'theme', depth: 0 }),
    payload.findGlobal({ slug: 'identity', depth: 0 }),
  ])

  await mkdir(path.join(OUT, 'media'), { recursive: true })

  // Copy each original upload (not the generated size variants — those are
  // regenerated automatically when the file is re-uploaded on import).
  let copied = 0
  const missing: string[] = []
  for (const m of media as Array<{ filename?: string | null }>) {
    if (!m.filename) continue
    try {
      await cp(path.join(MEDIA_SRC, m.filename), path.join(OUT, 'media', m.filename))
      copied++
    } catch {
      missing.push(m.filename)
    }
  }

  const bundle = {
    exportedAt: new Date().toISOString(),
    counts: {
      projects: projects.length,
      posts: posts.length,
      testimonials: testimonials.length,
      media: media.length,
    },
    media,
    projects,
    posts,
    testimonials,
    globals: { homepage, contact, theme, identity },
  }

  await writeFile(path.join(OUT, 'content.json'), JSON.stringify(bundle, null, 2))

  payload.logger.info(
    `Exported ${projects.length} projects, ${posts.length} posts, ${testimonials.length} testimonials, ${media.length} media (${copied} files copied).`,
  )
  if (missing.length) {
    payload.logger.warn(`Missing original files (skipped): ${missing.join(', ')}`)
  }
  payload.logger.info(`Bundle written to ${OUT}`)
  process.exit(0)
}

await run()
