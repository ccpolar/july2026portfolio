import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

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
export const getPortfolio = cache(async () => {
  const payload = await client()
  const [branding, merchandise, advertising, websites] = await Promise.all([
    payload.find({ collection: 'branding', sort: 'order', depth: 1, limit: 100 }),
    payload.find({ collection: 'merchandise', sort: 'order', depth: 1, limit: 100 }),
    payload.find({ collection: 'advertising', sort: 'order', depth: 1, limit: 100 }),
    payload.find({ collection: 'websites', sort: 'order', depth: 1, limit: 100 }),
  ])
  return {
    branding: branding.docs,
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
