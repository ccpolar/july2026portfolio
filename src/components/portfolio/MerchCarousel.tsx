import type { Merchandise } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './MerchCarousel.module.css'

/**
 * An endless, self-scrolling belt of product shots. The track holds two copies
 * of the items back to back and translates by exactly half its width, so the
 * loop is seamless with no visible jump. Pure CSS animation — pauses on hover,
 * and stops entirely under reduced motion (see the module).
 */
export const MerchCarousel = ({ items }: { items: Merchandise[] }) => {
  if (!items.length) return null

  // Two copies so the -50% translate lands the second copy exactly where the
  // first began. aria-hidden on the clone so screen readers read each once.
  const run = [
    ...items.map((item) => ({ item, clone: false })),
    ...items.map((item) => ({ item, clone: true })),
  ]

  return (
    <div className={styles.viewport}>
      <ul className={styles.track} style={{ '--count': items.length } as React.CSSProperties}>
        {run.map(({ item, clone }, i) => (
          <li
            className={styles.item}
            key={`${item.id}-${i}`}
            aria-hidden={clone ? 'true' : undefined}
          >
            <MediaImage className={styles.image} media={item.image} sizes="18rem" />
          </li>
        ))}
      </ul>
    </div>
  )
}
