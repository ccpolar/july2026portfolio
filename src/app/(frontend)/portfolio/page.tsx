import type { Metadata } from 'next'

import { AdvertisingGallery } from '@/components/portfolio/AdvertisingGallery'
import { BrandingRows } from '@/components/portfolio/BrandingRows'
import { MerchShowcase } from '@/components/portfolio/MerchShowcase'
import { PortfolioSection } from '@/components/portfolio/PortfolioSection'
import { WebsiteShowcase } from '@/components/portfolio/WebsiteShowcase'
import { ScrollToTop } from '@/components/ScrollToTop'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { getHomepage, getPortfolio } from '@/lib/data'

import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const [chrome, home] = await Promise.all([getChrome(), getHomepage()])
  return {
    title: `${home.portfolioHeading?.trim() || 'Portfolio'} — ${chrome.siteName}`,
    description:
      home.portfolioIntro?.trim() ||
      'The full body of work — branding, merchandise, advertising, and website design.',
  }
}

const Empty = ({ label }: { label: string }) => (
  <p className={styles.empty}>No {label.toLowerCase()} here yet — this section is being filled.</p>
)

export default async function PortfolioPage() {
  const [chrome, portfolio, home] = await Promise.all([getChrome(), getPortfolio(), getHomepage()])
  const { branding, merchandise, advertising, websites } = portfolio

  // One scroll, four categories in order, rather than four tab panels behind
  // four clicks. Every category keeps its place even when empty, so the page
  // reads the same way each visit and a link to one still lands somewhere.
  const sections = [
    {
      id: 'branding',
      label: 'Branding',
      content: branding.length ? <BrandingRows items={branding} /> : <Empty label="Branding" />,
    },
    {
      id: 'merchandise',
      label: 'Merchandise',
      content: merchandise.length ? (
        <MerchShowcase items={merchandise} />
      ) : (
        <Empty label="Merchandise" />
      ),
    },
    {
      id: 'advertising',
      label: 'Advertising',
      content: advertising.length ? (
        <AdvertisingGallery items={advertising} />
      ) : (
        <Empty label="Advertising" />
      ),
    },
    {
      id: 'websites',
      label: 'Website Design',
      content: websites.length ? <WebsiteShowcase items={websites} /> : <Empty label="Websites" />,
    },
  ]

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <div className={`shell ${styles.head}`}>
          <h1 className={styles.heading}>{home.portfolioHeading?.trim() || 'Portfolio'}</h1>
          {home.portfolioIntro?.trim() ? (
            <p className={styles.intro}>{home.portfolioIntro}</p>
          ) : null}
        </div>

        <div className={`shell ${styles.body}`}>
          {sections.map((section) => (
            <PortfolioSection key={section.id} id={section.id} label={section.label}>
              {section.content}
            </PortfolioSection>
          ))}
        </div>
      </main>
      <ScrollToTop />
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
