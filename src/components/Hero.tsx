import type { Contact, Homepage } from '@/payload-types'

import { ButtonLink } from './Button'
import styles from './Hero.module.css'

type Props = {
  home: Homepage
  contact: Contact
}

export const Hero = ({ home, contact }: Props) => (
  <section className={`shell ${styles.hero}`} id="top">
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
        <ButtonLink href={`mailto:${contact.email}`} withArrow>
          Start a project
        </ButtonLink>
        {contact.bookingUrl ? (
          <ButtonLink href={contact.bookingUrl} variant="secondary">
            Book a call
          </ButtonLink>
        ) : null}
      </div>
    </div>
  </section>
)
