'use client'

import { usePathname } from 'next/navigation'

import { openContactModal } from '@/lib/contactModal'

import styles from './SiteHeader.module.css'

type Props = {
  siteName: string
  logo: { url: string; height: number } | null
  showBlog: boolean
}

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.75" y="4.25" width="14.5" height="11.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="m3.5 5.5 5.63 4.5a1.4 1.4 0 0 0 1.74 0L16.5 5.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Three pieces floating over the top of the page rather than a full-width
 * bar: the mark (home), the two ways into the work, and a direct line to get
 * in touch. Each piece is its own lifted surface, so the header needs no
 * backdrop of its own and the page runs uninterrupted beneath it.
 */
export const SiteHeader = ({ siteName, logo, showBlog }: Props) => {
  const pathname = usePathname()
  const onPortfolio = pathname === '/portfolio'

  return (
    <header className={styles.header} style={{ viewTransitionName: 'site-header' }}>
      <nav className={styles.bar} aria-label="Primary">
        <a className={`${styles.tile} ${styles.mark}`} href="/" aria-label={`${siteName} — home`}>
          {logo ? (
            <img className={styles.logo} src={logo.url} alt="" />
          ) : (
            <span className={styles.initial} aria-hidden="true">
              {siteName.charAt(0)}
            </span>
          )}
        </a>

        <div className={styles.links}>
          <a className={styles.link} href="/#work">
            Recent Work
          </a>
          <a
            className={styles.link}
            href="/portfolio"
            aria-current={onPortfolio ? 'page' : undefined}
          >
            View Work
          </a>
          {showBlog ? (
            <a
              className={styles.link}
              href="/blog"
              aria-current={pathname.startsWith('/blog') ? 'page' : undefined}
            >
              Blog
            </a>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.tile}
          onClick={openContactModal}
          aria-label="Get in touch"
        >
          <MailIcon />
        </button>
      </nav>
    </header>
  )
}
