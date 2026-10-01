import type { PortfolioItem } from '@/lib/portfolioItem'

import { MediaImage } from '../MediaImage'
import styles from './BrandingRows.module.css'

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
 * Branding work as wide, full-bleed thumbnails stacked one per row — the same
 * generous, editorial rhythm as the homepage's Recent Work. A piece with a case
 * study behind it becomes a link to it; one that's just an image stays an image.
 */
export const BrandingRows = ({ items }: { items: PortfolioItem[] }) => {
  if (!items.length) return null

  return (
    <div className={styles.rows}>
      {items.map((item, i) => {
        const href = item.href ?? null

        const inner = (
          <>
            <div className={styles.frame}>
              <MediaImage
                className={styles.image}
                media={item.image}
                priority={i === 0}
                sizes="(min-width: 88rem) 88rem, 100vw"
              />
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.title}>{item.title}</span>
              {href ? (
                <span className={styles.cue}>
                  View project
                  <Arrow />
                </span>
              ) : null}
            </figcaption>
          </>
        )

        return href ? (
          <a className={`${styles.row} ${styles.link}`} key={item.id} href={href}>
            {inner}
          </a>
        ) : (
          <figure className={styles.row} key={item.id}>
            {inner}
          </figure>
        )
      })}
    </div>
  )
}
