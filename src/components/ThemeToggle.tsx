'use client'

import { useEffect, useState } from 'react'

import { requestTheme, THEME_CHANGE_EVENT } from '@/lib/appearance'

import styles from './ThemeToggle.module.css'

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 1.6v1.8M10 16.6v1.8M18.4 10h-1.8M3.4 10H1.6M15.94 4.06l-1.27 1.27M5.33 14.67l-1.27 1.27M15.94 15.94l-1.27-1.27M5.33 5.33 4.06 4.06"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Switches the site between the light palette set in /admin and the dark one.
 *
 * The <head> script has already decided the palette and written data-theme
 * before paint, so this reads that attribute rather than holding its own idea
 * of the state — and renders nothing until it has, so the button can't show
 * the wrong icon for a frame.
 *
 * The switch itself turns over as soon as it is pressed; the page follows
 * about half a second later, under the warmest part of the sunset. Pressing a
 * control should feel instant even when what it sets in motion takes a
 * moment.
 */
export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
    read()
    // The palette can also change from somewhere else — another tab's
    // choice, or the sky finishing its run — so follow the attribute rather
    // than assuming this button is the only thing that moves it.
    root.addEventListener(THEME_CHANGE_EVENT, read)
    return () => root.removeEventListener(THEME_CHANGE_EVENT, read)
  }, [])

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => {
        const next = dark ? 'light' : 'dark'
        setTheme(next)
        requestTheme(next)
      }}
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      // Until the effect has read the attribute there's no honest state to
      // show, so the icons stay hidden rather than guessing.
      data-ready={theme !== null}
    >
      <span className={styles.icon}>{dark ? <MoonIcon /> : <SunIcon />}</span>
    </button>
  )
}
