import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { hasCaseStudy } from '@/lib/portfolioItem'
import { hasText } from '@/lib/richText'
import { SITE_URL } from '@/lib/site'

// Rebuilt at most once an hour, so new work and posts appear without a deploy.
export const revalidate = 3600

/**
 * Every public page: the fixed ones, each live case study and each published
 * post. Drafts never appear, and the legal pages only once they have text
 * (they 404 until then).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const [projects, posts, legal, toolbox] = await Promise.all([
    payload
      .find({ collection: 'projects', where: { status: { equals: 'live' } }, depth: 0, limit: 500 })
      .then((r) => r.docs)
      .catch(() => []),
    payload
      .find({ collection: 'posts', where: { published: { equals: true } }, depth: 0, limit: 500 })
      .then((r) => r.docs)
      .catch(() => []),
    payload.findGlobal({ slug: 'legal', depth: 0 }).catch(() => null),
    payload.findGlobal({ slug: 'toolbox', depth: 0 }).catch(() => null),
  ])

  const page = (path: string, priority: number, lastModified?: string | null): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    priority,
    ...(lastModified ? { lastModified } : {}),
  })

  return [
    page('/', 1),
    page('/portfolio', 0.9),
    page('/work', 0.9),
    ...(toolbox?.enabled !== false ? [page('/toolbox', 0.6)] : []),
    page('/moodboard', 0.5),
    page('/snippets', 0.5),
    ...(posts.length ? [page('/blog', 0.6)] : []),
    ...projects.filter((p) => p.slug && hasCaseStudy(p)).map((p) => page(`/work/${p.slug}`, 0.8, p.updatedAt)),
    ...posts.filter((p) => p.slug).map((p) => page(`/blog/${p.slug}`, 0.6, p.updatedAt)),
    ...(hasText(legal?.terms) ? [page('/terms', 0.2)] : []),
    ...(hasText(legal?.privacy) ? [page('/privacy', 0.2)] : []),
  ]
}
