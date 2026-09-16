import type { Homepage, Media, Service } from '@/payload-types'

import { DarkPanel, panelCard } from './DarkPanel'
import { MediaImage } from './MediaImage'
import styles from './Services.module.css'

type Props = {
  home: Homepage
  services: Service[]
}

const isMedia = (value: unknown): value is Media =>
  Boolean(value) && typeof value === 'object' && Boolean((value as Media).url)

/** What Cam offers: a card per service, each with an image or GIF, a
 * description and a pricing range. */
export const Services = ({ home, services }: Props) => {
  // A service goes live once it has a description; until then it can be set up
  // in the admin without a half-finished card appearing on the site.
  const visible = services.filter((service) => service.description?.trim())
  if (!visible.length) return null

  return (
    <DarkPanel
      id="services"
      heading={home.servicesHeading?.trim() || 'Services'}
      intro={home.servicesIntro?.trim()}
    >
      {visible.map((service, i) => {
        const media = isMedia(service.image) ? service.image : null

        return (
          <article key={service.id} {...panelCard(i, visible.length)}>
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
    </DarkPanel>
  )
}
