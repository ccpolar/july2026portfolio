'use client'

import type { CSSProperties } from 'react'

import type { Merchandise } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import { useLightbox } from './Lightbox'
import styles from './MerchCarousel.module.css'

/**
 * An endless, self-scrolling belt of square product shots. The track holds two
 * copies of the items back to back and translates by exactly half its width, so
 * the loop is seamless with no visible jump. Pure CSS animation — pauses on
 * hover, and stops entirely under reduced motion (see the module). Clicking a
 * shot opens it full size in the shared lightbox.
 */
export const MerchCarousel = ({ items }: { items: Merchandise[] }) => {
  const { open, element } = useLightbox(items)

  if (!items.length) return null

  // Two copies so the -50% translate lands the second copy exactly where the
  // first began. aria-hidden on the clone so screen readers read each once.
  const run = [
    ...items.map((item, index) => ({ item, index, clone: false })),
    ...items.map((item, index) => ({ item, index, clone: true })),
  ]

  return (
    <>
      <div className={styles.viewport}>
        <ul className={styles.track} style={{ '--count': items.length } as CSSProperties}>
          {run.map(({ item, index, clone }, i) => (
            <li className={styles.item} key={`${item.id}-${i}`} aria-hidden={clone || undefined}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => open(index)}
                aria-label={`View ${item.title} full size`}
                // The clone is a visual duplicate; keeping it out of the tab
                // order stops the belt from being traversed twice, and keeps
                // focusable content out of an aria-hidden subtree.
                tabIndex={clone ? -1 : undefined}
              >
                <MediaImage className={styles.image} media={item.image} sizes="18rem" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {element}
    </>
  )
}
