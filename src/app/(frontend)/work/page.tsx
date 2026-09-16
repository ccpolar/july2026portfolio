import type { Metadata } from 'next'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { WorkSection } from '@/components/WorkSection'
import { getChrome } from '@/lib/chrome'
import { getFeaturedProjects, getHomepage } from '@/lib/data'

export async function generateMetadata(): Promise<Metadata> {
  const [chrome, home] = await Promise.all([getChrome(), getHomepage()])
  return {
    title: `Recent Work — ${chrome.siteName}`,
    description: home.workIntro || 'Recent projects, each with its own case study.',
  }
}

export default async function RecentWorkPage() {
  const [home, projects, chrome] = await Promise.all([
    getHomepage(),
    getFeaturedProjects(),
    getChrome(),
  ])

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <WorkSection home={home} projects={projects} standalone />
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
