'use client'

import { openContactModal } from '@/lib/contactModal'

import styles from './SiteHeader.module.css'

type Props = {
  siteName: string
  logo: { url: string; height: number } | null
  showBlog: boolean
}

export const SiteHeader = ({ siteName, logo, showBlog }: Props) => {
  return (
    <header className={styles.header} style={{ viewTransitionName: 'site-header' }}>
      <div className={`shell ${styles.inner}`}>
        <a className={styles.wordmark} href="/" aria-label={`${siteName} — home`}>
          {logo ? (
            <img
              className={styles.logo}
              src={logo.url}
              alt={siteName}
              style={{ height: logo.height }}
            />
          ) : (
            siteName
          )}
        </a>
        <nav className={styles.nav} aria-label="Primary">
          <a className={`${styles.link} ${styles.navOnly}`} href="/">
            Home
          </a>
          <a className={`${styles.link} ${styles.navOnly}`} href="/portfolio">
            Work
          </a>
          <a className={`${styles.link} ${styles.navOnly}`} href="/#approach">
            Approach
          </a>
          {showBlog ? (
            <a className={styles.link} href="/blog">
              Blog
            </a>
          ) : null}
          <button type="button" className={styles.mail} onClick={openContactModal}>
            Get in touch
          </button>
        </nav>
      </div>
    </header>
  )
}
