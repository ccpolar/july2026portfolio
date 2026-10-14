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
      'The full body of work — branding, apparel graphics, garment design, advertising, email, and website design.',
  }
}

const Empty = ({ label }: { label: string }) => (
  <p className={styles.empty}>No {label.toLowerCase()} here yet — this section is being filled.</p>
)

export default async function PortfolioPage() {
  const [chrome, portfolio, home] = await Promise.all([getChrome(), getPortfolio(), getHomepage()])
  const { branding, merchandise, garment, advertising, email, websites } = portfolio

  // One scroll, every category in order, rather than tab panels behind
  // clicks. Every category keeps its place even when empty, so the page
  // reads the same way each visit and a link to one still lands somewhere.
  const allSections = [
    {
      id: 'branding',
      label: 'Branding',
      count: branding.length,
      content: branding.length ? <BrandingRows items={branding} /> : <Empty label="Branding" />,
    },
    {
      // Stored as 'merchandise', so the anchor keeps that name and old links
      // to /portfolio#merchandise still land here.
      id: 'merchandise',
      label: 'Apparel Graphics',
      count: merchandise.length,
      content: merchandise.length ? (
        <MerchShowcase items={merchandise} />
      ) : (
        <Empty label="Apparel graphics" />
      ),
    },
    {
      // The same tiles as advertising: a piece with a case study opens it,
      // one that's a single image opens full screen.
      id: 'garment',
      // Off the page entirely until it has something in it.
      hideWhenEmpty: true,
      label: 'Garment Design',
      count: garment.length,
      content: garment.length ? (
        <AdvertisingGallery items={garment} />
      ) : (
        <Empty label="Garment design" />
      ),
    },
    {
      id: 'advertising',
      label: 'Advertising',
      count: advertising.length,
      content: advertising.length ? (
        <AdvertisingGallery items={advertising} />
      ) : (
        <Empty label="Advertising" />
      ),
    },
    {
      // Same two-up grid as advertising: a tile is the project's hero, and
      // the emails themselves are what its page is for.
      id: 'email',
      label: 'Email Design',
      count: email.length,
      content: email.length ? (
        <AdvertisingGallery items={email} />
      ) : (
        <Empty label="Email design" />
      ),
    },
    {
      id: 'websites',
      label: 'Website Design',
      count: websites.length,
      content: websites.length ? <WebsiteShowcase items={websites} /> : <Empty label="Websites" />,
    },
  ]

  const sections = allSections.filter((section) => !(section.hideWhenEmpty && !section.count))

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

        {/* A way straight to any category, rather than scrolling past the
            ones before it. Plain links to each section's own anchor: the
            page already scrolls smoothly and stops each heading clear of the
            nav, so there is nothing to script. */}
        <nav className={`shell ${styles.guide}`} aria-label="Portfolio sections">
          <ul className={styles.guideList}>
            {sections.map((section) => (
              <li key={section.id}>
                <a className={styles.guideLink} href={`#${section.id}`}>
                  {section.label}
                  {section.count ? (
                    <span className={styles.guideCount}>
                      <span className="sr-only">, </span>
                      {section.count}
                      <span className="sr-only"> {section.count === 1 ? 'piece' : 'pieces'}</span>
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </nav>

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
