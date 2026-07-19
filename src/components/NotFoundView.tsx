import { ButtonLink } from '@/components/Button'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import type { ChromeProps } from '@/lib/chrome'

import styles from './NotFoundView.module.css'

/**
 * Shared by both 404 entry points: the one inside the (frontend) group that
 * catches notFound() from a project page, and the root one that catches URLs
 * matching nothing at all. Two files are unavoidable — the app has separate
 * root layouts for the site and the admin — but the page itself is one.
 */
export const NotFoundView = ({ chrome }: { chrome: ChromeProps }) => (
  <>
    <SiteHeader {...chrome} />
    <main className={`shell ${styles.wrap}`}>
      <p className={styles.marker}>
        <span className={styles.code}>404</span>
        <span className={styles.rule} aria-hidden="true" />
        <span>Nothing at this address</span>
      </p>

      {/* Taking the blame is the whole point. Someone who followed a link they
          were given did nothing wrong, and a page that says so is a small
          proof of the thing the rest of the site is only claiming. */}
      <h1 className={styles.title}>Nothing here, and that’s on me.</h1>

      <p className={styles.body}>
        Either a link went stale or I moved something and didn’t redirect it. The work is all
        still where it should be.
      </p>

      <div className={styles.actions}>
        <ButtonLink href="/#work" withArrow>
          See the work
        </ButtonLink>
        <ButtonLink href={`mailto:${chrome.email}?subject=Broken link`} variant="secondary">
          Tell me what broke
        </ButtonLink>
      </div>
    </main>
    <SiteFooter siteName={chrome.siteName} />
  </>
)
