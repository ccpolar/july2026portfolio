'use client'

import type { Snippet } from '@/payload-types'

import { MediaImage } from './MediaImage'
import { useLightbox } from './portfolio/Lightbox'
import styles from './SnippetsGrid.module.css'

/**
 * Screengrabs as a grid of 16:9 thumbnails — three across on a desktop, two on
 * a phone — each with its note in a bubble underneath. Clicking one opens it
 * full screen in the same lightbox the portfolio uses, so the arrow keys page
 * through the set and Escape closes.
 */
export const SnippetsGrid = ({ items }: { items: Snippet[] }) => {
  // The lightbox shows a piece's own words under the full image; a snippet's
  // note is that text.
  const { open, element } = useLightbox(
    items.map((item) => ({ id: item.id, title: item.title, caption: item.note, image: item.image })),
  )

  if (!items.length) return null

  return (
    <>
      <ul className={styles.grid}>
        {items.map((item, i) => (
          <li className={styles.item} key={item.id}>
            <figure className={styles.figure}>
              <button
                type="button"
                className={styles.thumb}
                onClick={() => open(i)}
                aria-label={`View ${item.title} full screen`}
              >
                <MediaImage
                  className={styles.image}
                  media={item.image}
                  sizes="(min-width: 64rem) 22rem, 46vw"
                />
              </button>

              {item.note?.trim() ? (
                <figcaption className={styles.bubble}>{item.note.trim()}</figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>

      {element}
    </>
  )
}
