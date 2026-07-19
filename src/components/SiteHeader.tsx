'use client'

import { useEffect, useState } from 'react'

import styles from './SiteHeader.module.css'

type Props = {
  email: string
}

export const SiteHeader = ({ email }: Props) => {
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
        <a className={styles.wordmark} href="#top">
          Cam
        </a>
        <nav className={styles.nav} aria-label="Primary">
          <a className={`${styles.link} ${styles.navOnly}`} href="#work">
            Work
          </a>
          <a className={`${styles.link} ${styles.navOnly}`} href="#approach">
            Approach
          </a>
          <a className={styles.mail} href={`mailto:${email}`}>
            Get in touch
          </a>
        </nav>
      </div>
    </header>
  )
}
