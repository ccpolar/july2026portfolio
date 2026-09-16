import type { Metadata } from 'next'
import React from 'react'

import { ContactModal } from '@/components/ContactModal'
import { LivePreviewTheme } from '@/components/LivePreviewTheme'
import { NoImageDownloads } from '@/components/NoImageDownloads'
import { SiteBackground } from '@/components/SiteBackground'
import { getHomepage, getIdentity, getServices, getTheme } from '@/lib/data'
import { themeToCss } from '@/lib/theme'
import type { Media } from '@/payload-types'

import './globals.css'
import styles from './layout.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [home, identity] = await Promise.all([getHomepage(), getIdentity()])

  const title = identity?.browserTitle || 'Cam — Designer'
  const faviconMedia =
    identity?.favicon && typeof identity.favicon === 'object' ? (identity.favicon as Media) : null
  // Prefer the resized thumb when it exists (server-processed uploads); large
  // client-uploaded images have no size variants, so fall back to the original.
  // Take the type from the SAME variant being linked — the thumb can be a
  // different format (jpeg) than the original (webp), and a mismatched type
  // hint makes some browsers skip the icon.
  const faviconVariant = faviconMedia?.sizes?.thumb
  const faviconUrl = faviconVariant?.url ?? faviconMedia?.url ?? undefined
  const faviconType = faviconVariant?.mimeType ?? faviconMedia?.mimeType ?? undefined

  return {
    title,
    description: home.metaDescription ?? undefined,
    // Declare the type so browsers identify the format (e.g. webp) correctly,
    // and register it as the shortcut icon too for older/bookmark contexts.
    icons: faviconUrl
      ? { icon: [{ url: faviconUrl, type: faviconType }], shortcut: [faviconUrl] }
      : undefined,
    openGraph: {
      title,
      description: home.metaDescription ?? undefined,
      type: 'website',
    },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [theme, services] = await Promise.all([getTheme(), getServices()])
  // The intake's "How can I help?" options are the services shown on the
  // homepage, so the two never disagree. The names Cam set up are the
  // fallback until any service is live.
  const liveServices = services.filter((s) => s.description?.trim()).map((s) => s.title)
  const intakeServices = liveServices.length
    ? liveServices
    : ['Branding', 'Brand Kit OS', 'UI Design', 'Merchandise', 'Advertising']

  return (
    <html lang="en">
      <head>
        {/* Neue Haas Grotesk, served from Cam's Adobe Fonts kit (licensed for
            campagano.com). Text and Display cuts: see --font-text and
            --font-display in globals.css. */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://use.typekit.net/wxs8ixt.css" />
        <style
          // Brand colours are content, not code — they come from /admin.
          dangerouslySetInnerHTML={{ __html: themeToCss(theme) }}
        />
      </head>
      <body>
        <SiteBackground />
        <LivePreviewTheme initialData={theme} />
        {/* Public site only — /admin keeps its normal right-click. */}
        <NoImageDownloads />
        <div className={styles.content}>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          {children}
        </div>
        {/* One dialog for the whole site — the header's "Get in touch" and
            the hero's "Start a project" both open it by id rather than each
            holding their own copy. */}
        <ContactModal services={intakeServices} />
      </body>
    </html>
  )
}
