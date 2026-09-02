import type { CSSProperties } from 'react'

import type { Project } from '@/payload-types'

import { MediaImage } from './MediaImage'
import styles from './ProjectGallery.module.css'

type GalleryItem = NonNullable<Project['gallery']>[number]

type Props = {
  items: Project['gallery']
  /** Gap between images, in pixels. Falls back to the standard editorial
   * spacing. 0 butts the images together with no seam — the setting to use
   * when one artwork has been split across several files. */
  gap?: number | null
}

const DEFAULT_GAP = 48

export const ProjectGallery = ({ items, gap }: Props) => {
  if (!items?.length) return null

  const space = typeof gap === 'number' ? gap : DEFAULT_GAP
  const seamless = space === 0

  return (
    <div
      className={`${styles.gallery} ${seamless ? styles.seamless : ''}`}
      style={{ '--gallery-gap': `${space}px` } as CSSProperties}
    >
      {items.map((item: GalleryItem) => {
        const half = item.size === 'half'
        return (
          <figure
            className={`${styles.item} ${half ? styles.half : ''}`}
            key={item.id ?? `${item.caption}`}
          >
            <div className={styles.frame}>
              <MediaImage
                className={styles.image}
                media={item.image}
                sizes={half ? '(min-width: 40rem) 43rem, 100vw' : '(min-width: 88rem) 88rem, 100vw'}
              />
            </div>
            {item.caption ? <figcaption className={styles.caption}>{item.caption}</figcaption> : null}
          </figure>
        )
      })}
    </div>
  )
}
