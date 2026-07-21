import type { CSSProperties } from 'react'

import type { Contact, Homepage } from '@/payload-types'

import { ButtonLink } from './Button'
import styles from './Hero.module.css'
import { MediaImage } from './MediaImage'
import { OpenContactButton } from './OpenContactButton'

type Props = {
  home: Homepage
  contact: Contact
}

export const Hero = ({ home, contact }: Props) => {
  const image =
    home.heroImage && typeof home.heroImage === 'object' ? home.heroImage : null
  const imageSize = home.heroImageSize ?? 40

  const content = (
    <div>
      {home.available ? (
        <p className={styles.marker}>
          <span className={styles.dot} aria-hidden="true" />
          {home.availabilityLabel ?? 'Available for new work'}
        </p>
      ) : null}

      <h1 className={styles.title}>{home.heroLine}</h1>

      <div className={styles.aside}>
        <p className={styles.intro}>{home.heroIntro}</p>
        <div className={styles.actions}>
          <OpenContactButton withArrow>Start a project</OpenContactButton>
          {contact.bookingUrl ? (
            <ButtonLink href={contact.bookingUrl} variant="secondary">
              Book a call
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </div>
  )

  return (
    <section className={`shell ${styles.hero}`} id="top">
      <div
        className={image ? styles.grid : undefined}
        style={image ? ({ '--hero-image-size': `${imageSize}%` } as CSSProperties) : undefined}
      >
        {content}

        {image ? (
          <div className={styles.imageFrame}>
            <MediaImage
              className={styles.image}
              media={image}
              priority
              sizes="(min-width: 64rem) 40vw, 100vw"
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}
