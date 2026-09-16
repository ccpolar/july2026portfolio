import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import type { Branding, Project } from '@/payload-types'

const client = cache(async () => getPayload({ config }))

export const getHomepage = cache(async () => {
  const payload = await client()
  return payload.findGlobal({ slug: 'homepage', depth: 1 })
})

export const getContact = cache(async () => {
  const payload = await client()
  return payload.findGlobal({ slug: 'contact', depth: 1 })
})

export const getTheme = cache(async () => {
  const payload = await client()
  return payload.findGlobal({ slug: 'theme', depth: 0 })
})

export const getFeaturedProjects = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'projects',
    where: { featured: { equals: true } },
    sort: 'order',
    depth: 1,
    limit: 12,
  })
  return docs
})

export const getTestimonials = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'testimonials',
    where: { published: { equals: true } },
    sort: 'order',
    depth: 0,
    limit: 12,
  })
  return docs
})

export const getClients = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'clients',
    sort: 'order',
    depth: 1,
    limit: 60,
  })
  return docs
})

export const getIdentity = cache(async () => {
  const payload = await client()
  return payload.findGlobal({ slug: 'identity', depth: 1 })
})

export const getMoodboard = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'moodboard',
    sort: 'order',
    depth: 1,
    limit: 100,
  })
  return docs
})

// The four portfolio categories. Each is its own collection, sorted by the
// admin's manual order, images resolved (depth 1) so the page can render them.
/**
 * A branding piece copied in from Recent Work arrives with its Project link
 * already set, so its thumbnail opens the full case study. One added by hand
 * has that field empty, and would silently render as a dead image. Fall back
 * to the project of the same name — the pairing "Add to portfolio" creates
 * anyway — so a piece is clickable however it was added. An explicit link
 * always wins.
 */
const linkBrandingByTitle = async (payload: Payload, docs: Branding[]) => {
  const key = (title?: string | null) => title?.trim().toLowerCase() ?? ''
  const unlinked = docs.filter((doc) => !doc.project && key(doc.title))
  if (!unlinked.length) return docs

  const { docs: projects } = await payload.find({ collection: 'projects', depth: 0, limit: 100 })
  const byTitle = new Map<string, Project | null>()
  for (const project of projects) {
    const k = key(project.title)
    // Two projects sharing a title link to neither, rather than to a guess.
    byTitle.set(k, byTitle.has(k) ? null : project)
  }

  return docs.map((doc) => {
    if (doc.project || !key(doc.title)) return doc
    const match = byTitle.get(key(doc.title))
    return match ? { ...doc, project: match } : doc
  })
}

export const getPortfolio = cache(async () => {
  const payload = await client()
  const [branding, merchandise, advertising, websites] = await Promise.all([
    payload.find({ collection: 'branding', sort: 'order', depth: 1, limit: 100 }),
    payload.find({ collection: 'merchandise', sort: 'order', depth: 1, limit: 100 }),
    payload.find({ collection: 'advertising', sort: 'order', depth: 1, limit: 100 }),
    payload.find({ collection: 'websites', sort: 'order', depth: 1, limit: 100 }),
  ])
  return {
    branding: await linkBrandingByTitle(payload, branding.docs),
    merchandise: merchandise.docs,
    advertising: advertising.docs,
    websites: websites.docs,
  }
})

export const countPublishedPosts = cache(async () => {
  const payload = await client()
  const { totalDocs } = await payload.count({
    collection: 'posts',
    where: { published: { equals: true } },
  })
  return totalDocs
})

export const getPublishedPosts = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { published: { equals: true } },
    sort: '-publishedAt',
    depth: 1,
    limit: 50,
  })
  return docs
})
