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
    description: 'Screengrabs from work in progress — pieces of projects as they come together.',
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
            Screengrabs from work in progress — pieces of projects as they come together. Click any
            one to see it full size.
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
