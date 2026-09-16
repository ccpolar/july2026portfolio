import type { Homepage, Media, Service } from '@/payload-types'

import { MediaImage } from './MediaImage'
import styles from './Services.module.css'

type Props = {
  home: Homepage
  services: Service[]
}

const isMedia = (value: unknown): value is Media =>
  Boolean(value) && typeof value === 'object' && Boolean((value as Media).url)

/**
 * What Cam offers, set on a dark panel so it reads as a distinct chapter of
 * the homepage rather than one more band of the same page. Cards run in rows
 * of three; a short final row widens its cards to fill the width, so any count
 * lands as a complete composition — five services sit three over two.
 */
export const Services = ({ home, services }: Props) => {
  // A service goes live once it has a description; until then it can be set up
  // in the admin without a half-finished card appearing on the site.
  const visible = services.filter((service) => service.description?.trim())
  if (!visible.length) return null

  const perRow = 3
  const remainder = visible.length % perRow
  const lastRowStart = remainder ? visible.length - remainder : visible.length

  const heading = home.servicesHeading?.trim() || 'Services'
  const intro = home.servicesIntro?.trim()

  return (
    <section className={`shell ${styles.section}`} id="services" aria-labelledby="services-heading">
      <div className={styles.panel}>
        <div className={styles.head}>
          <h2 className={styles.heading} id="services-heading">
            {heading}
          </h2>
          {intro ? <p className={styles.intro}>{intro}</p> : null}
        </div>

        <div className={styles.grid}>
          {visible.map((service, i) => {
            const media = isMedia(service.image) ? service.image : null
            // Desktop grid has six tracks: a full row of three spans two each;
            // the cards of a short last row share all six between them.
            const span = i >= lastRowStart ? 6 / remainder : 2
            // At two columns, an odd card out on its own takes the full row.
            const loneOnTablet = visible.length % 2 === 1 && i === visible.length - 1

            return (
              <article
                className={`${styles.card} ${loneOnTablet ? styles.lone : ''}`}
                key={service.id}
                style={{ '--span': span } as React.CSSProperties}
              >
                <h3 className={styles.title}>{service.title}</h3>

                {/* The area is always present so a row's descriptions stay level while
                    images are still being added; empty, it's a faint dot grid. */}
                {media ? (
                  <div className={styles.media}>
                    {/* GIFs stay animated: Payload keeps every frame when it
                        converts and resizes an animated upload. */}
                    <MediaImage
                      className={`${styles.image} ${service.imageFit === 'fill' ? styles.fill : ''}`}
                      media={media}
                      sizes="(min-width: 64rem) 30rem, (min-width: 40rem) 50vw, 100vw"
                    />
                  </div>
                ) : (
                  <div className={`${styles.media} ${styles.empty}`} aria-hidden="true" />
                )}

                <p className={styles.description}>{service.description}</p>

                {service.price?.trim() ? (
                  <p className={styles.price}>
                    <span className={styles.priceLabel}>Pricing</span>
                    <span className={styles.priceValue}>{service.price.trim()}</span>
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
