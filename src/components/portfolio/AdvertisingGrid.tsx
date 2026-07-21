import type { Advertising } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './AdvertisingGrid.module.css'

/**
 * Advertising work as a straight gallery grid — breakpoint-free via auto-fill,
 * so it stays even from phone to wide desktop without media queries.
 */
export const AdvertisingGrid = ({ items }: { items: Advertising[] }) => {
  if (!items.length) return null

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <figure className={styles.item} key={item.id}>
          <div className={styles.frame}>
            <MediaImage
              className={styles.image}
              media={item.image}
              sizes="(min-width: 64rem) 28rem, (min-width: 40rem) 45vw, 100vw"
            />
          </div>
          {item.caption ? <figcaption className={styles.caption}>{item.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  )
}
