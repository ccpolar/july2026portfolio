'use client'

import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'

import { openContactModal } from '@/lib/contactModal'

import styles from './SiteHeader.module.css'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  siteName: string
  logo: { url: string; height: number; ratio: number | null } | null
  showBlog: boolean
}

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.75" y="4.25" width="14.5" height="11.5" rx="2.25" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="m3.5 5.5 5.63 4.5a1.4 1.4 0 0 0 1.74 0L16.5 5.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * One bar hanging off the top of the screen: the mark at the left, the ways
 * into the work in the middle, and the way to get in touch filled in at the
 * right so the one thing worth doing is the one thing that is a button.
 *
 * The mark stands alone — the name isn't set beside it. It is still the
 * link's accessible name, so anyone listening to the page hears whose site
 * this is; it just isn't said twice to anyone looking at it.
 *
 * It inverts the page rather than sitting on it — near-black on a light page —
 * which is what lets it stay legible over whatever happens to be scrolling
 * underneath without a backdrop filter or a border doing the work. On a dark
 * page there is nothing to invert to, so it lifts off the background instead.
 */
export const SiteHeader = ({ siteName, logo, showBlog }: Props) => {
  const pathname = usePathname()
  // The portfolio is the one way into the work now, and a project page is
  // part of it, so a case study keeps the link lit.
  const onWork =
    pathname === '/portfolio' || pathname === '/work' || pathname.startsWith('/work/')

  return (
    <header className={styles.header} style={{ viewTransitionName: 'site-header' }}>
      <nav className={styles.bar} aria-label="Primary">
        <a className={styles.brand} href="/" aria-label={`${siteName} — home`}>
          {logo ? (
            // A masked box rather than an image, so the mark is painted in
            // the bar's own colour and turns over with it. See .logo.
            <span
              className={styles.logo}
              style={
                {
                  // Quoted, not re-encoded: the URL arrives already percent-
                  // encoded, and encoding it again turns %20 into %2520.
                  // JSON.stringify escapes only the quote and backslash that
                  // could close a CSS string early.
                  '--logo-src': `url(${JSON.stringify(logo.url)})`,
                  ...(logo.ratio ? { '--logo-ratio': String(logo.ratio) } : {}),
                } as CSSProperties
              }
            />
          ) : (
            <span className={styles.initial} aria-hidden="true">
              {siteName.charAt(0)}
            </span>
          )}
        </a>

        <div className={styles.links}>
          <a
            className={styles.link}
            href="/portfolio"
            aria-current={onWork ? 'page' : undefined}
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

        <div className={styles.actions}>
          <ThemeToggle />
          {/* Labelled explicitly: the words are dropped on a narrow screen,
              leaving the icon to stand for it, and the button has to keep its
              name either way. */}
          <button
            type="button"
            className={styles.cta}
            onClick={openContactModal}
            aria-label="Get in touch"
          >
            <MailIcon />
            <span className={styles.ctaLabel}>Get in touch</span>
          </button>
        </div>
      </nav>
    </header>
  )
}
