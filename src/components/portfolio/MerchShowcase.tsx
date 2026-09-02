'use client'

import { useState, type CSSProperties } from 'react'

import type { Merchandise } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import { useLightbox } from './Lightbox'
import styles from './MerchShowcase.module.css'

const CarouselIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="5" y="3.5" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2.5 5.5v5M13.5 5.5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    <rect x="9" y="9" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)

type View = 'carousel' | 'grid'

/**
 * Merchandise in either of two views, switched by the visitor.
 *
 * Carousel: an endless, self-scrolling belt. The track holds two copies of the
 * items back to back and translates by exactly half its width, so the loop is
 * seamless with no visible jump. Pure CSS — it pauses on hover and focus, and
 * stops entirely under reduced motion (see the module).
 *
 * Grid: every shot at once, nothing moving — the view for actually studying
 * the work rather than watching it go by.
 *
 * Both are square, and a shot in either opens full size in the shared lightbox.
 */
export const MerchShowcase = ({ items }: { items: Merchandise[] }) => {
  const [view, setView] = useState<View>('carousel')
  const { open, element } = useLightbox(items)

  if (!items.length) return null

  // Two copies so the -50% translate lands the second copy exactly where the
  // first began. aria-hidden on the clone so screen readers read each once.
  const run = [
    ...items.map((item, index) => ({ item, index, clone: false })),
    ...items.map((item, index) => ({ item, index, clone: true })),
  ]

  const thumb = (item: Merchandise, index: number, clone = false) => (
    <button
      type="button"
      className={styles.thumb}
      onClick={() => open(index)}
      aria-label={`View ${item.title} full size`}
      // A clone is a visual duplicate; keeping it out of the tab order stops
      // the belt being traversed twice, and keeps focusable content out of an
      // aria-hidden subtree.
      tabIndex={clone ? -1 : undefined}
    >
      <MediaImage
        className={styles.image}
        media={item.image}
        sizes="(min-width: 64rem) 18rem, (min-width: 40rem) 30vw, 60vw"
      />
    </button>
  )

  return (
    <>
      <div className={styles.head}>
        <div className={styles.switch} role="group" aria-label="Merchandise view">
          <button
            type="button"
            className={`${styles.option} ${view === 'carousel' ? styles.optionActive : ''}`}
            onClick={() => setView('carousel')}
            aria-pressed={view === 'carousel'}
          >
            <CarouselIcon />
            Carousel
          </button>
          <button
            type="button"
            className={`${styles.option} ${view === 'grid' ? styles.optionActive : ''}`}
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
          >
            <GridIcon />
            Grid
          </button>
        </div>
      </div>

      {/* key on the view so switching remounts the container and the settle
          animation replays, marking the change without a transition library. */}
      {view === 'carousel' ? (
        <div className={styles.viewport} key="carousel">
          <ul className={styles.track} style={{ '--count': items.length } as CSSProperties}>
            {run.map(({ item, index, clone }, i) => (
              <li className={styles.item} key={`${item.id}-${i}`} aria-hidden={clone || undefined}>
                {thumb(item, index, clone)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className={styles.grid} key="grid">
          {items.map((item, index) => (
            <li className={styles.gridItem} key={item.id}>
              {thumb(item, index)}
            </li>
          ))}
        </ul>
      )}

      {element}
    </>
  )
}
