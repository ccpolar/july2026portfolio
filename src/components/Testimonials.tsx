import type { Testimonial } from '@/payload-types'

import { DarkPanel, panelCard } from './DarkPanel'
import styles from './Testimonials.module.css'

/** Clients in their own words, one card each, on the same black panel as
 * Services so the two read as a matched pair. */
export const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
  // No published quotes means no section. An empty proof shell is worse than
  // no proof at all — it advertises the absence.
  if (!testimonials.length) return null

  return (
    <DarkPanel id="testimonials" heading="What clients say">
      {testimonials.map((t, i) => {
        const detail = [t.role, t.company].filter(Boolean).join(', ')

        return (
          <figure key={t.id} {...panelCard(i, testimonials.length, styles.item)}>
            <blockquote className={styles.quote}>“{t.quote}”</blockquote>
            <figcaption className={styles.attrib}>
              <span className={styles.name}>{t.name}</span>
              {detail ? <span className={styles.detail}>{detail}</span> : null}
            </figcaption>
          </figure>
        )
      })}
    </DarkPanel>
  )
}
