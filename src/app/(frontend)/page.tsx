import { Approach } from '@/components/Approach'
import { ContactSection } from '@/components/ContactSection'
import { Hero } from '@/components/Hero'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { Testimonials } from '@/components/Testimonials'
import { TrustedBy } from '@/components/TrustedBy'
import { WorkSection } from '@/components/WorkSection'
import { getChrome } from '@/lib/chrome'
import {
  getClients,
  getContact,
  getFeaturedProjects,
  getHomepage,
  getTestimonials,
} from '@/lib/data'

export default async function HomePage() {
  const [home, contact, projects, testimonials, clients, chrome] = await Promise.all([
    getHomepage(),
    getContact(),
    getFeaturedProjects(),
    getTestimonials(),
    getClients(),
    getChrome(),
  ])

  return (
    <>
      <SiteHeader {...chrome} />
      <main>
        <Hero home={home} contact={contact} />
        <TrustedBy home={home} clients={clients} />
        <WorkSection home={home} projects={projects} />
        <Approach home={home} />
        <Testimonials testimonials={testimonials} />
        <ContactSection contact={contact} />
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
