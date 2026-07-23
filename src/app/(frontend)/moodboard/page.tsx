import type { Metadata } from 'next'

import { MoodboardBlocks } from '@/components/MoodboardBlocks'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { getMoodboard } from '@/lib/data'

import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const chrome = await getChrome()
  return {
    title: `Moodboard — ${chrome.siteName}`,
    description: 'References, textures, and things worth keeping — arrange them however you like.',
  }
}

export default async function MoodboardPage() {
  const [chrome, items] = await Promise.all([getChrome(), getMoodboard()])

  return (
    <>
      <SiteHeader {...chrome} />
      <main>
        <div className={`shell ${styles.head}`}>
          <h1 className={styles.heading}>Moodboard</h1>
          <p className={styles.intro}>
            References, textures, and things worth keeping. Pick up a block and move it — the board
            is yours to rearrange.
          </p>
        </div>

        <div className={`shell ${styles.board}`}>
          {items.length ? (
            <MoodboardBlocks items={items} />
          ) : (
            <p className={styles.empty}>Nothing pinned up yet — the board is being filled.</p>
          )}
        </div>
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
