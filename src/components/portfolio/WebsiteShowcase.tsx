import type { PortfolioItem } from '@/lib/portfolioItem'

import { MediaImage } from '../MediaImage'
import styles from './WebsiteShowcase.module.css'

/** Strip protocol and trailing slash for the address-bar label. */
const prettyUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

const Frame = ({ site }: { site: PortfolioItem }) => (
  <>
    <div className={styles.chrome}>
      <span className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {site.liveUrl ? <span className={styles.address}>{prettyUrl(site.liveUrl)}</span> : null}
    </div>
    <div className={styles.viewport}>
      <MediaImage
        className={styles.shot}
        media={site.image}
        sizes="(min-width: 88rem) 88rem, 100vw"
      />
    </div>
  </>
)

/**
 * Website design, each shot inside a browser frame that scrolls on hover.
 *
 * The frame opens the live site, in a new tab. A website is shown as the thing
 * it is: someone looking at one wants to use it, not read about it. Only a site
 * with no address yet falls back to its case study, so it stays reachable.
 */
export const WebsiteShowcase = ({ items }: { items: PortfolioItem[] }) => {
  if (!items.length) return null

  return (
    <div className={styles.grid}>
      {items.map((site) => {
        const href = site.liveUrl ?? site.href ?? null
        // Leaving the site is the one case that wants a new tab.
        const external = Boolean(site.liveUrl)

        return (
          <figure className={styles.item} key={site.id}>
            {href ? (
              <a
                className={styles.window}
                href={href}
                {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              >
                <Frame site={site} />
                {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
              </a>
            ) : (
              <div className={styles.window}>
                <Frame site={site} />
              </div>
            )}
            <figcaption className={styles.caption}>
              <span className={styles.title}>{site.title}</span>
              {site.liveUrl ? (
                <span className={styles.visit}>Visit site ↗</span>
              ) : site.href ? (
                <span className={styles.visit}>View project →</span>
              ) : null}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
