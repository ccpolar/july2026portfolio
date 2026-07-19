import { Approach } from '@/components/Approach'
import { ContactSection } from '@/components/ContactSection'
import { Hero } from '@/components/Hero'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { Testimonials } from '@/components/Testimonials'
import { WorkSection } from '@/components/WorkSection'
import { getChrome } from '@/lib/chrome'
import { getContact, getFeaturedProjects, getHomepage, getTestimonials } from '@/lib/data'

export default async function HomePage() {
  const [home, contact, projects, testimonials, chrome] = await Promise.all([
    getHomepage(),
    getContact(),
    getFeaturedProjects(),
    getTestimonials(),
    getChrome(),
  ])

  return (
    <>
      <SiteHeader {...chrome} />
      <main>
        <Hero home={home} contact={contact} />
        <WorkSection home={home} projects={projects} />
        <Approach home={home} />
        <Testimonials testimonials={testimonials} />
        <ContactSection contact={contact} />
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
