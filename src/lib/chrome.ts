import { cache } from 'react'

import type { Media } from '@/payload-types'

import { countPublishedPosts, getContact, getIdentity } from './data'

/**
 * Everything the site header and footer need, fetched once per request.
 * Spread straight into <SiteHeader {...chrome} /> — the props line up exactly.
 */
export type ChromeProps = {
  email: string
  siteName: string
  logo: { url: string; height: number } | null
  showBlog: boolean
}

export const getChrome = cache(async (): Promise<ChromeProps> => {
  const [contact, identity, postCount] = await Promise.all([
    getContact(),
    getIdentity(),
    countPublishedPosts(),
  ])

  const media =
    identity?.logo && typeof identity.logo === 'object' ? (identity.logo as Media) : null
  // The header renders the logo ~28px tall, so the 480px thumb variant is
  // plenty even on retina. SVGs get no variants and fall back to the original.
  const url = media?.sizes?.thumb?.url ?? media?.url ?? null

  return {
    email: contact.email,
    siteName: identity?.siteName || 'Cam',
    logo: url ? { url, height: identity?.logoHeight ?? 28 } : null,
    showBlog: postCount > 0,
  }
})
