import type { Metadata } from 'next'

import { AdvertisingGrid } from '@/components/portfolio/AdvertisingGrid'
import { BrandingGrid } from '@/components/portfolio/BrandingGrid'
import { MerchCarousel } from '@/components/portfolio/MerchCarousel'
import { WebsiteShowcase } from '@/components/portfolio/WebsiteShowcase'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { getPortfolio } from '@/lib/data'

import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const chrome = await getChrome()
  return {
    title: `Portfolio — ${chrome.siteName}`,
    description: 'The full body of work — branding, merchandise, advertising, and website design.',
  }
}

export default async function PortfolioPage() {
  const [chrome, portfolio] = await Promise.all([getChrome(), getPortfolio()])
  const { branding, merchandise, advertising, websites } = portfolio

  // Each section is drawn only when it has something to show — an empty
  // category is silently skipped rather than announcing a gap.
  const sections = [
    {
      id: 'branding',
      title: 'Branding',
      note: null,
      show: branding.length > 0,
      content: <BrandingGrid items={branding} />,
    },
    {
      id: 'merchandise',
      title: 'Merchandise',
      note: null,
      show: merchandise.length > 0,
      content: <MerchCarousel items={merchandise} />,
    },
    {
      id: 'advertising',
      title: 'Advertising',
      note: null,
      show: advertising.length > 0,
      content: <AdvertisingGrid items={advertising} />,
    },
    {
      id: 'websites',
      title: 'Website design',
      note: null,
      show: websites.length > 0,
      content: <WebsiteShowcase items={websites} />,
    },
  ].filter((s) => s.show)

  return (
    <>
      <SiteHeader {...chrome} />
      <main>
        <div className={`shell ${styles.head}`}>
          <h1 className={styles.heading}>Portfolio</h1>
          <p className={styles.intro}>
            Everything, sorted by what it is — branding, merchandise, advertising, and the web.
          </p>
        </div>

        {sections.length ? (
          sections.map((section) => (
            <section
              className={`shell ${styles.section}`}
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
            >
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id={`${section.id}-heading`}>
                  {section.title}
                </h2>
                {section.note ? <p className={styles.note}>{section.note}</p> : null}
              </div>
              {section.content}
            </section>
          ))
        ) : (
          <p className={`shell ${styles.empty}`}>
            The full portfolio is being assembled — check back shortly.
          </p>
        )}
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
