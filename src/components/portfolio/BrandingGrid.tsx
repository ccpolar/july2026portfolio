import type { Branding } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './BrandingGrid.module.css'

/**
 * Branding work as a clean four-column grid — every cell the same size, so the
 * pieces read as one considered set rather than a scatter. Steps down to two
 * columns on tablet and one on phones.
 */
export const BrandingGrid = ({ items }: { items: Branding[] }) => {
  if (!items.length) return null

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <figure className={styles.item} key={item.id}>
          <div className={styles.frame}>
            <MediaImage
              className={styles.image}
              media={item.image}
              sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 45vw, 100vw"
            />
          </div>
          <figcaption className={styles.caption}>{item.title}</figcaption>
        </figure>
      ))}
    </div>
  )
}
