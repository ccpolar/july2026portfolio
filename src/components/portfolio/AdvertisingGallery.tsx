'use client'

import type { Advertising } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './AdvertisingGallery.module.css'
import { useLightbox } from './Lightbox'

/**
 * Advertising work as a grid of 4:5 thumbnails, each captioned with its title.
 * Clicking one opens it full-screen in the shared lightbox.
 */
export const AdvertisingGallery = ({ items }: { items: Advertising[] }) => {
  const { open, element } = useLightbox(items)

  if (!items.length) return null

  return (
    <>
      <div className={styles.grid}>
        {items.map((item, i) => (
          <figure className={styles.item} key={item.id}>
            <button
              type="button"
              className={styles.thumb}
              onClick={() => open(i)}
              aria-label={`View ${item.title} full screen`}
            >
              <MediaImage
                className={styles.image}
                media={item.image}
                sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 40vw, 100vw"
              />
            </button>
            <figcaption className={styles.caption}>{item.title}</figcaption>
          </figure>
        ))}
      </div>

      {element}
    </>
  )
}
