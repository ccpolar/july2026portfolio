import { Hero } from '@/components/Hero'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { Testimonials } from '@/components/Testimonials'
import { TrustedBy } from '@/components/TrustedBy'
import { WorkStack } from '@/components/WorkStack'
import { getChrome } from '@/lib/chrome'
import {
  getClients,
  getContact,
  getFeaturedProjects,
  getHomepage,
  getTestimonials,
} from '@/lib/data'

export default async function HomePage() {
  const [home, contact, testimonials, clients, projects, chrome] = await Promise.all([
    getHomepage(),
    getContact(),
    getTestimonials(),
    getClients(),
    getFeaturedProjects(),
    getChrome(),
  ])

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <Hero home={home} contact={contact} />
        <TrustedBy home={home} clients={clients} />
        <WorkStack home={home} projects={projects} />
        <Testimonials testimonials={testimonials} />
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
