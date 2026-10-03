'use client'

import { usePathname } from 'next/navigation'

import { openContactModal } from '@/lib/contactModal'

import styles from './SiteHeader.module.css'
import { ThemeToggle } from './ThemeToggle'

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
 * One lifted rectangle floating over the top of the page rather than a
 * full-width bar. Everything lives inside it — the mark, the way into the
 * work, the line to get in touch and the theme switch — divided by hairlines
 * rather than by gaps, so it reads as a single control with segments instead
 * of four separate pieces that happen to be next to each other.
 */
export const SiteHeader = ({ siteName, logo, showBlog }: Props) => {
  const pathname = usePathname()
  // The portfolio is the one way into the work now, and a project page is
  // part of it, so a case study keeps the segment lit.
  const onWork =
    pathname === '/portfolio' || pathname === '/work' || pathname.startsWith('/work/')

  return (
    <header className={styles.header} style={{ viewTransitionName: 'site-header' }}>
      <nav className={styles.bar} aria-label="Primary">
        <a className={`${styles.segment} ${styles.mark}`} href="/" aria-label={`${siteName} — home`}>
          {logo ? (
            <img className={styles.logo} src={logo.url} alt="" />
          ) : (
            <span className={styles.initial} aria-hidden="true">
              {siteName.charAt(0)}
            </span>
          )}
        </a>

        <a
          className={`${styles.segment} ${styles.link}`}
          href="/portfolio"
          aria-current={onWork ? 'page' : undefined}
        >
          View Work
        </a>

        {showBlog ? (
          <a
            className={`${styles.segment} ${styles.link}`}
            href="/blog"
            aria-current={pathname.startsWith('/blog') ? 'page' : undefined}
          >
            Blog
          </a>
        ) : null}

        <button
          type="button"
          className={styles.segment}
          onClick={openContactModal}
          aria-label="Get in touch"
        >
          <MailIcon />
        </button>

        <ThemeToggle />
      </nav>
    </header>
  )
}
