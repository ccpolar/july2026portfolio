'use client'

import { useEffect, useState } from 'react'

import styles from './ScrollToTop.module.css'

const ArrowUp = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 13V3.5M3.5 8 8 3.5 12.5 8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * The way back up a long page.
 *
 * Hidden until there's enough behind you to be worth it — about a screen —
 * so it never sits over the top of the page it would take you to. Rendered
 * only once it's wanted rather than faded in from nothing, so it's never an
 * invisible target over the content underneath it.
 */
export const ScrollToTop = ({ label = 'Back to top' }: { label?: string }) => {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!shown) return null

  const toTop = () => {
    // Someone who has asked for less motion gets taken there outright rather
    // than flown the length of the page.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <button type="button" className={styles.button} onClick={toTop} aria-label={label}>
      <ArrowUp />
    </button>
  )
}
