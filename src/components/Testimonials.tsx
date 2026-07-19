import type { Testimonial } from '@/payload-types'

import styles from './Testimonials.module.css'

export const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
  // No published quotes means no section. An empty proof shell is worse than
  // no proof at all — it advertises the absence.
  if (!testimonials.length) return null

  return (
    <section className={`shell ${styles.section}`} aria-labelledby="words-heading">
      <h2 className="sr-only" id="words-heading">
        What clients say
      </h2>
      <ul className={styles.list}>
        {testimonials.map((t) => (
          <li key={t.id}>
            <figure className={styles.item}>
              <blockquote className={styles.quote}>“{t.quote}”</blockquote>
              <figcaption className={styles.attrib}>
                <span className={styles.name}>{t.name}</span>
                {t.role ? (
                  <>
                    <span className={styles.sep} aria-hidden="true" />
                    <span>{t.role}</span>
                  </>
                ) : null}
                {t.company ? (
                  <>
                    <span className={styles.sep} aria-hidden="true" />
                    <span>{t.company}</span>
                  </>
                ) : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
