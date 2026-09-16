import { Hero } from '@/components/Hero'
import { Services } from '@/components/Services'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { Testimonials } from '@/components/Testimonials'
import { TrustedBy } from '@/components/TrustedBy'
import { getChrome } from '@/lib/chrome'
import {
  getClients,
  getContact,
  getHomepage,
  getServices,
  getTestimonials,
} from '@/lib/data'

export default async function HomePage() {
  const [home, contact, testimonials, clients, services, chrome] = await Promise.all([
    getHomepage(),
    getContact(),
    getTestimonials(),
    getClients(),
    getServices(),
    getChrome(),
  ])

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <Hero home={home} contact={contact} />
        <TrustedBy home={home} clients={clients} />
        <Services home={home} services={services} />
        <Testimonials testimonials={testimonials} />
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
