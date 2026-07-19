import type { Project } from '@/payload-types'

import { MediaImage } from './MediaImage'
import styles from './ProjectGallery.module.css'

type GalleryItem = NonNullable<Project['gallery']>[number]

export const ProjectGallery = ({ items }: { items: Project['gallery'] }) => {
  if (!items?.length) return null

  return (
    <div className={styles.gallery}>
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
