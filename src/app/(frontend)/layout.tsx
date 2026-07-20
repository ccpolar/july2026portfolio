import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
import React from 'react'

import { ContactModal } from '@/components/ContactModal'
import { LivePreviewTheme } from '@/components/LivePreviewTheme'
import { SiteBackground } from '@/components/SiteBackground'
import { getContact, getHomepage, getTheme } from '@/lib/data'
import { themeToCss } from '@/lib/theme'

import './globals.css'
import styles from './layout.module.css'

// One family, two axes. Width carries the display voice so the page never
// needs a second typeface to create contrast.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-archivo',
})

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomepage()
  return {
    title: home.metaTitle ?? 'Cam — Designer',
    description: home.metaDescription ?? undefined,
    openGraph: {
      title: home.metaTitle ?? 'Cam — Designer',
      description: home.metaDescription ?? undefined,
      type: 'website',
    },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [theme, contact] = await Promise.all([getTheme(), getContact()])

  return (
    <html lang="en" className={archivo.variable}>
      <head>
        <style
          // Brand colours are content, not code — they come from /admin.
          dangerouslySetInnerHTML={{ __html: themeToCss(theme) }}
        />
      </head>
      <body>
        <SiteBackground />
        <LivePreviewTheme initialData={theme} />
        <div className={styles.content}>
          <a className="skip-link" href="#work">
            Skip to the work
          </a>
          {children}
        </div>
        {/* One dialog for the whole site — the header's "Get in touch" and
            the hero's "Start a project" both open it by id rather than each
            holding their own copy. */}
        <ContactModal heading={contact.heading} />
      </body>
    </html>
  )
}
