'use client'

import { useConfig } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import styles from './NavBrand.module.css'

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

/**
 * The way back to the dashboard, at the top of the sidebar. Payload's nav has
 * no link to it — only the breadcrumb does — so this adds one, filled in as
 * the inverted pill while the dashboard is the page you're on.
 */
export const DashboardLink = () => {
  const pathname = usePathname()
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()
  const here = pathname === admin || pathname === `${admin}/`

  return (
    <Link
      className={styles.dashboard}
      href={admin}
      aria-current={here ? 'page' : undefined}
      prefetch={false}
    >
      <GridIcon />
      Dashboard
    </Link>
  )
}
