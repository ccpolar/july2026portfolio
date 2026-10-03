import type { CSSProperties } from 'react'

import type { Testimonial } from '@/payload-types'

import styles from './Testimonials.module.css'

/** Below this there isn't enough to loop: with three on screen at a time, a
 *  shorter run would put the same quote on screen twice at once, which reads
 *  as a bug rather than as a carousel. Those sit still instead. */
const MIN_TO_LOOP = 4

/** Roughly how long one quote takes to cross, in seconds. The whole loop is
 *  this times the number of quotes, so the belt travels at the same speed
 *  whether there are four of them or twenty. */
const SECONDS_PER_QUOTE = 9

const Card = ({ t }: { t: Testimonial }) => {
  const detail = [t.role, t.company].filter(Boolean).join(', ')

  return (
    <figure className={styles.card}>
      <blockquote className={styles.quote}>“{t.quote}”</blockquote>
      <figcaption className={styles.attrib}>
        <span className={styles.name}>{t.name}</span>
        {detail ? <span className={styles.detail}>{detail}</span> : null}
      </figcaption>
    </figure>
  )
}

/**
 * Clients in their own words, drifting past three at a time.
 *
 * The belt is two copies of the same run, moved left by exactly one copy and
 * then started again — at that point the second copy is sitting precisely
 * where the first began, so the restart is invisible and the quotes appear to
 * go on forever. The duplicate is hidden from screen readers, which should
 * hear each quote once.
 *
 * It is all CSS: no scroll listener, no timer, nothing to run per frame, and
 * it works with JavaScript off. It holds still while hovered or while
 * anything inside it has focus, so a quote can actually be read, and it holds
 * still permanently for anyone who asked for less motion — the row becomes an
 * ordinary horizontal scroller for them instead, so every quote is still
 * reachable.
 */
export const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
  // No published quotes means no section. An empty proof shell is worse than
  // no proof at all — it advertises the absence.
  if (!testimonials.length) return null

  const loops = testimonials.length >= MIN_TO_LOOP

  return (
    <section className={`shell ${styles.section}`} id="testimonials" aria-labelledby="testimonials-heading">
      <div className={styles.head}>
        <h2 className={styles.heading} id="testimonials-heading">
          What clients say
        </h2>
      </div>

      <div className={styles.belt} data-loops={loops || undefined}>
        <ul
          className={styles.track}
          style={{ '--count': testimonials.length } as CSSProperties}
        >
          {testimonials.map((t) => (
            <li className={styles.slot} key={t.id}>
              <Card t={t} />
            </li>
          ))}
          {loops
            ? testimonials.map((t) => (
                <li className={styles.slot} key={`${t.id}-again`} aria-hidden="true">
                  <Card t={t} />
                </li>
              ))
            : null}
        </ul>
      </div>
    </section>
  )
}
