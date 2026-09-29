'use client'

import { useEffect, useState } from 'react'

import { THEME_CHANGE_EVENT, THEME_STORAGE_KEY } from '@/lib/appearance'

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
 */
export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  const apply = (next: 'light' | 'dark', remember = true) => {
    const root = document.documentElement
    root.setAttribute('data-theme', next)
    root.style.colorScheme = next
    setTheme(next)
    if (remember) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        /* storage blocked — the choice lasts for this page only */
      }
    }
    root.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT))
  }

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    setTheme(current === 'dark' ? 'dark' : 'light')
  }, [])

  // Follow the device while the visitor hasn't chosen for themselves.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY)
      } catch {
        /* storage blocked — treat as no choice made */
      }
      if (stored === 'light' || stored === 'dark') return
      apply(e.matches ? 'dark' : 'light', false)
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => apply(dark ? 'light' : 'dark')}
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
