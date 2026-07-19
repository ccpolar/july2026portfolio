import config from '@payload-config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'

/**
 * Re-creates the exported content bundle in whatever database + storage the
 * current environment points at. Run this once against production:
 *
 *   DATABASE_URI=<postgres-url> \
 *   BLOB_READ_WRITE_TOKEN=<token> \
 *   PAYLOAD_SECRET=<secret> \
 *   npm run migrate:import
 *
 * Media files are re-uploaded (so they land in Vercel Blob and their size
 * variants regenerate), and every relationship is re-pointed at the new ids.
 *
 * Guard: refuses to run if the target already has content, unless MIGRATE_FORCE=1.
 * It never touches users — create your admin via the first-user screen at /admin.
 */

const BUNDLE = path.resolve(process.cwd(), 'backups/content-export')

type Ref = number | string | { id?: number | string } | null | undefined
const idOf = (ref: Ref): string | null => {
  if (ref == null) return null
  if (typeof ref === 'object') return ref.id != null ? String(ref.id) : null
  return String(ref)
}

// Walk a Lexical richText tree and re-point any embedded upload nodes.
const remapUploads = (node: unknown, map: Map<string, number>): unknown => {
  if (Array.isArray(node)) return node.map((n) => remapUploads(n, map))
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node)) out[k] = remapUploads(v, map)
    if (out.type === 'upload' && out.relationTo === 'media') {
      const old = idOf(out.value as Ref)
      if (old && map.has(old)) out.value = map.get(old)
    }
    return out
  }
  return node
}

const strip = <T extends Record<string, unknown>>(doc: T): Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'globalType'> => {
  const { id, createdAt, updatedAt, globalType, ...rest } = doc as Record<string, unknown>
  void id
  void createdAt
  void updatedAt
  void globalType
  return rest as Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'globalType'>
}

const run = async () => {
  const payload = await getPayload({ config })
  // Dynamic content from the export bundle — typed `any` on purpose, then
  // re-pointed at new media ids below before it goes into typed create calls.
  const bundle = JSON.parse(await readFile(path.join(BUNDLE, 'content.json'), 'utf8'))

  const existing = await payload.count({ collection: 'projects' })
  if (existing.totalDocs > 0 && process.env.MIGRATE_FORCE !== '1') {
    payload.logger.error(
      `Target already has ${existing.totalDocs} projects. Re-running would duplicate them. ` +
        `Set MIGRATE_FORCE=1 to clear content collections and re-import.`,
    )
    process.exit(1)
  }

  if (process.env.MIGRATE_FORCE === '1') {
    for (const collection of ['projects', 'testimonials', 'media'] as const) {
      await payload.delete({ collection, where: { id: { exists: true } } })
    }
    payload.logger.info('MIGRATE_FORCE: cleared projects, testimonials, media.')
  }

  // 1. Re-upload media, building an old-id -> new-id map.
  const mediaMap = new Map<string, number>()
  for (const m of bundle.media as Array<{ id: number; filename: string; alt: string; mimeType?: string }>) {
    const data = await readFile(path.join(BUNDLE, 'media', m.filename))
    const created = await payload.create({
      collection: 'media',
      data: { alt: m.alt },
      file: {
        data,
        mimetype: m.mimeType || 'image/jpeg',
        name: m.filename,
        size: data.length,
      },
    })
    mediaMap.set(String(m.id), created.id as number)
  }
  payload.logger.info(`Uploaded ${mediaMap.size} media files.`)

  // 2. Recreate projects with remapped media relationships. `!` is safe: the
  // export verified every cover/gallery reference resolves to a media record.
  for (const p of bundle.projects) {
    await payload.create({
      collection: 'projects',
      data: {
        ...strip(p),
        cover: mediaMap.get(idOf(p.cover) ?? '')!,
        gallery: Array.isArray(p.gallery)
          ? p.gallery.map((g: Record<string, unknown>) => ({
              image: mediaMap.get(idOf(g.image as Ref) ?? '')!,
              caption: g.caption as string | undefined,
              size: g.size as 'full' | 'half' | undefined,
            }))
          : undefined,
        disciplines: Array.isArray(p.disciplines)
          ? p.disciplines.map((d: { label: string }) => ({ label: d.label }))
          : undefined,
        body: p.body ? remapUploads(p.body, mediaMap) : undefined,
      } as RequiredDataFromCollectionSlug<'projects'>,
    })
  }
  payload.logger.info(`Created ${bundle.projects.length} projects.`)

  // 3. Recreate testimonials.
  for (const t of bundle.testimonials) {
    await payload.create({
      collection: 'testimonials',
      data: strip(t) as RequiredDataFromCollectionSlug<'testimonials'>,
    })
  }
  payload.logger.info(`Created ${bundle.testimonials.length} testimonials.`)

  // 4. Restore globals.
  for (const slug of ['homepage', 'contact', 'theme'] as const) {
    const data = bundle.globals?.[slug]
    if (data) await payload.updateGlobal({ slug, data: strip(data) })
  }
  payload.logger.info('Restored homepage, contact and theme.')

  payload.logger.info('Migration import complete. Create your admin user at /admin.')
  process.exit(0)
}

await run()
