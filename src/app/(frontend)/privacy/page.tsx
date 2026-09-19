import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LegalDocument } from '@/components/LegalDocument'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { getLegal } from '@/lib/data'
import { hasText } from '@/lib/richText'

export async function generateMetadata(): Promise<Metadata> {
  const chrome = await getChrome()
  return { title: `Privacy Policy — ${chrome.siteName}` }
}

export default async function PrivacyPage() {
  const [chrome, legal] = await Promise.all([getChrome(), getLegal()])

  // Until it's written in /admin, the page doesn't exist (and the footer
  // doesn't link to it).
  if (!legal.privacy || !hasText(legal.privacy)) notFound()

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <LegalDocument title="Privacy Policy" content={legal.privacy} />
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
