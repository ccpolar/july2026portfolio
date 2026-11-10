'use client'

import { useConfig, useTheme } from '@payloadcms/ui'

import styles from './NavFooter.module.css'

const LogOutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * The foot of the sidebar: a Light / Dark pill and the way out.
 *
 * The pill drives Payload's own theme setting, so the choice is remembered
 * the same way the account page's theme option is. Log out takes over from
 * Payload's own footer link (hidden in admin.css), so the two sit on one row.
 */
export const NavFooter = () => {
  const { theme, setTheme } = useTheme()
  const {
    config: {
      routes: { admin },
      admin: {
        routes: { logout },
      },
    },
  } = useConfig()

  return (
    <div className={styles.foot}>
      <div className={styles.toggle} role="group" aria-label="Colour theme">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
          Light
        </button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
          Dark
        </button>
      </div>
      <a className={styles.logout} href={`${admin}${logout}`} aria-label="Log out" title="Log out">
        <LogOutIcon />
      </a>
    </div>
  )
}
