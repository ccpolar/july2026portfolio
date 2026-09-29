'use client'

import type { Advertising, Project } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './AdvertisingGallery.module.css'
import { useLightbox } from './Lightbox'

const Arrow = () => (
  <svg
    className={styles.arrow}
    width="12"
    height="12"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Advertising work as a grid of 4:5 thumbnails, each captioned with its title.
 *
 * A campaign linked to a Recent Work project opens that project's case study,
 * the way a branding piece does — that's where the campaign is written up. One
 * with no project behind it opens full screen in the shared lightbox instead,
 * so a single image is still worth clicking.
 */
export const AdvertisingGallery = ({ items }: { items: Advertising[] }) => {
  // Every piece stays in the lightbox's set, linked or not, so the arrow keys
  // page through the whole grid once it's open.
  const { open, element } = useLightbox(items)

  if (!items.length) return null

  return (
    <>
      <div className={styles.grid}>
        {items.map((item, i) => {
          // Populated at depth 1; only an object carries the slug to link to.
          const project =
            item.project && typeof item.project === 'object' ? (item.project as Project) : null
          const href = project?.slug ? `/work/${project.slug}` : null

          const image = (
            <MediaImage
              className={styles.image}
              media={item.image}
              sizes="(min-width: 64rem) 26rem, (min-width: 40rem) 45vw, 100vw"
            />
          )

          return (
            <figure className={styles.item} key={item.id}>
              {href ? (
                <a className={styles.thumb} href={href} aria-label={`${item.title} — view project`}>
                  {image}
                </a>
              ) : (
                <button
                  type="button"
                  className={styles.thumb}
                  onClick={() => open(i)}
                  aria-label={`View ${item.title} full screen`}
                >
                  {image}
                </button>
              )}

              <figcaption className={styles.caption}>
                <span className={styles.title}>{item.title}</span>
                {href ? (
                  <a className={styles.cue} href={href} tabIndex={-1} aria-hidden="true">
                    View project
                    <Arrow />
                  </a>
                ) : null}
              </figcaption>
            </figure>
          )
        })}
      </div>

      {element}
    </>
  )
}
