import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { type PortfolioSection, toPortfolioItem } from './portfolioItem'

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

export const getServices = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'services',
    sort: 'order',
    depth: 1,
    limit: 24,
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

export const getLoadingScreen = cache(async () => {
  const payload = await client()
  return payload.findGlobal({ slug: 'loading-screen', depth: 1 })
})

export const getLegal = cache(async () => {
  const payload = await client()
  return payload.findGlobal({ slug: 'legal', depth: 0 })
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

export const getSnippets = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'snippets',
    sort: 'order',
    depth: 1,
    limit: 100,
  })
  return docs
})

/**
 * The portfolio page, which is the same Work collection sliced by category.
 *
 * One query, grouped here rather than four queries against four collections:
 * a piece moves between sections by changing one field, and whatever has been
 * built on its Case study tab comes with it.
 */
export const getPortfolio = cache(async () => {
  const payload = await client()
  const { docs } = await payload.find({
    collection: 'projects',
    // Named rather than "not none", so a row whose category was never set
    // can't slip in on a NULL.
    where: { category: { in: ['branding', 'merchandise', 'advertising', 'website'] } },
    sort: 'order',
    depth: 1,
    limit: 200,
  })

  const of = (section: PortfolioSection) =>
    docs.filter((doc) => doc.category?.includes(section)).map(toPortfolioItem)

  return {
    branding: of('branding'),
    merchandise: of('merchandise'),
    advertising: of('advertising'),
    websites: of('website'),
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
