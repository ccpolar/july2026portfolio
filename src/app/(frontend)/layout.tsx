import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
import React from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { LivePreviewTheme } from '@/components/LivePreviewTheme'
import { getHomepage, getTheme } from '@/lib/data'
import { themeToCss } from '@/lib/theme'

import './globals.css'

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
  const theme = await getTheme()

  return (
    <html lang="en" className={archivo.variable}>
      <head>
        <style
          // Brand colours are content, not code — they come from /admin.
          dangerouslySetInnerHTML={{ __html: themeToCss(theme) }}
        />
      </head>
      <body>
        <LivePreviewTheme initialData={theme} />
        <a className="skip-link" href="#work">
          Skip to the work
        </a>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
