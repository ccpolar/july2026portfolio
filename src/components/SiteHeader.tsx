'use client'

import { useEffect, useState } from 'react'

import { openContactModal } from '@/lib/contactModal'

import styles from './SiteHeader.module.css'

type Props = {
  siteName: string
  logo: { url: string; height: number } | null
  showBlog: boolean
}

export const SiteHeader = ({ siteName, logo, showBlog }: Props) => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled}
      style={{ viewTransitionName: 'site-header' }}
    >
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
          <a className={`${styles.link} ${styles.navOnly}`} href="/#work">
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
