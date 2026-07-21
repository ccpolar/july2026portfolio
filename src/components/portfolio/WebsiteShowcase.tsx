import type { Media, Website } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './WebsiteShowcase.module.css'

/** Strip protocol and trailing slash for the address-bar label. */
const prettyUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

const Frame = ({ site }: { site: Website }) => {
  const screenshot = typeof site.screenshot === 'object' ? (site.screenshot as Media) : null

  return (
    <>
      <div className={styles.chrome}>
        <span className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        {site.liveUrl ? <span className={styles.address}>{prettyUrl(site.liveUrl)}</span> : null}
      </div>
      <div className={styles.viewport}>
        {screenshot ? (
          <MediaImage
            className={styles.shot}
            media={screenshot}
            sizes="(min-width: 64rem) 40rem, 100vw"
          />
        ) : null}
      </div>
    </>
  )
}

export const WebsiteShowcase = ({ items }: { items: Website[] }) => {
  if (!items.length) return null

  return (
    <div className={styles.grid}>
      {items.map((site) => (
        <figure className={styles.item} key={site.id}>
          {site.liveUrl ? (
            <a
              className={styles.window}
              href={site.liveUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Frame site={site} />
            </a>
          ) : (
            <div className={styles.window}>
              <Frame site={site} />
            </div>
          )}
          <figcaption className={styles.caption}>
            <span className={styles.title}>{site.title}</span>
            {site.liveUrl ? <span className={styles.visit}>Visit site →</span> : null}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
