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
  /** `ratio` is the file's own width ÷ height. The header draws the mark as
   *  a mask so it can take the bar's colour, and a masked box has no
   *  intrinsic size to lay itself out from. */
  logo: { url: string; height: number; ratio: number | null } | null
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
  const variant = media?.sizes?.thumb?.url ? media.sizes.thumb : media
  const url = variant?.url ?? null
  // From the same variant the url came from, so a thumb cropped to different
  // proportions than the original can't put the mark in a box of the wrong
  // shape. Null when the file doesn't report its size — an SVG often won't —
  // and the stylesheet falls back to the shape of the mark in use.
  const ratio =
    variant?.width && variant?.height ? variant.width / variant.height : null
  // showLogo is a new field — existing docs saved before it existed have it
  // absent (not false), and the header showed the logo whenever one was
  // uploaded, so absent must still mean "on" here.
  const showLogo = identity?.showLogo !== false

  return {
    email: contact.email,
    siteName: identity?.siteName || 'Cam',
    logo: url && showLogo ? { url, height: identity?.logoHeight ?? 28, ratio } : null,
    showBlog: postCount > 0,
  }
})
