import type { Branding } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './BrandingRows.module.css'

/**
 * Branding work as wide, full-bleed thumbnails stacked one per row — the same
 * generous, editorial rhythm as the homepage's Recent Work, letting each piece
 * fill the width rather than sitting in a small grid cell.
 */
export const BrandingRows = ({ items }: { items: Branding[] }) => {
  if (!items.length) return null

  return (
    <div className={styles.rows}>
      {items.map((item, i) => (
        <figure className={styles.row} key={item.id}>
          <div className={styles.frame}>
            <MediaImage
              className={styles.image}
              media={item.image}
              priority={i === 0}
              sizes="(min-width: 88rem) 88rem, 100vw"
            />
          </div>
          <figcaption className={styles.caption}>{item.title}</figcaption>
        </figure>
      ))}
    </div>
  )
}
