import type { Metadata } from 'next'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { SnippetsGrid } from '@/components/SnippetsGrid'
import { getChrome } from '@/lib/chrome'
import { getSnippets } from '@/lib/data'

import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const chrome = await getChrome()
  return {
    title: `Snippets — ${chrome.siteName}`,
    description:
      'Random snapshots of projects, works in progress, a glimpse into the processes.',
  }
}

export default async function SnippetsPage() {
  const [chrome, items] = await Promise.all([getChrome(), getSnippets()])

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <div className={`shell ${styles.head}`}>
          <h1 className={styles.heading}>Snippets</h1>
          <p className={styles.intro}>
            Random snapshots of projects, works in progress, a glimpse into the processes.
          </p>
        </div>

        <div className={`shell ${styles.body}`}>
          {items.length ? (
            <SnippetsGrid items={items} />
          ) : (
            <p className={styles.empty}>Nothing here yet — the first screengrabs are on their way.</p>
          )}
        </div>
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
