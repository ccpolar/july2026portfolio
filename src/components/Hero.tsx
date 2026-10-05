import type { CSSProperties } from 'react'

import type { Contact, Homepage } from '@/payload-types'

import { ButtonLink } from './Button'
import { HeroCards } from './HeroCards'
import styles from './Hero.module.css'
import { LandscapeScene } from './LandscapeScene'
import { MediaImage } from './MediaImage'
import { OpenContactButton } from './OpenContactButton'

type Props = {
  home: Homepage
  contact: Contact
}

/**
 * One centred column, read top to bottom: whether Cam is taking work, the
 * promise, who's making it, and the two ways to start. Nothing competes with
 * the headline for the first second on the page.
 *
 * It opens on a painted sky. The frame around the column exists only to let
 * that run the full width of the screen while the column keeps the page's
 * measure, and to let it reach up past its own top edge and pass behind the
 * sticky nav — otherwise the page would open on a band of background with
 * the sky starting under it.
 */
export const Hero = ({ home, contact }: Props) => {
  // Only a populated media object with a file behind it counts; a hero whose
  // image was deleted falls back to the text alone instead of an empty frame.
  const image =
    home.heroImage && typeof home.heroImage === 'object' && home.heroImage.url
      ? home.heroImage
      : null
  const imageSize = home.heroImageSize ?? 40

  return (
    <div className={styles.frame} id="top">
      <LandscapeScene scene="clouds" className={styles.sky} priority />

      <section className={`shell ${styles.hero}`}>
        <div className={styles.column}>
          {home.available ? (
            <p className={styles.badge}>
              <span className={styles.dot} aria-hidden="true" />
              {home.availabilityLabel ?? 'Available for new work'}
            </p>
          ) : null}

          <h1 className={styles.title}>{home.heroLine}</h1>

          <div className={styles.cards}>
            <HeroCards
              cards={home.heroCards}
              shape={home.heroCardsShape}
              height={home.heroCardsHeight}
            />
          </div>

          <p className={styles.intro}>{home.heroIntro}</p>

          <div className={styles.actions}>
            <OpenContactButton variant="solid" withArrow>
              Start a project
            </OpenContactButton>
            {contact.bookingUrl ? (
              <ButtonLink href={contact.bookingUrl} variant="soft">
                Book a call
              </ButtonLink>
            ) : null}
          </div>
        </div>

        {image ? (
          <div
            className={styles.imageFrame}
            style={{ '--hero-image-size': `${imageSize}%` } as CSSProperties}
          >
            <MediaImage
              className={styles.image}
              media={image}
              priority
              sizes="(min-width: 64rem) 60vw, 100vw"
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
