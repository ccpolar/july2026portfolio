import type { ReactNode } from 'react'

import styles from './PortfolioSection.module.css'

/**
 * One category on the portfolio page, under a rule with its name at the left.
 *
 * The page used to be four tab panels behind four clicks; it's one scroll now,
 * so each category needs a visible edge of its own to be found by scrolling
 * past it. The rule is that edge, and the name sits at the start of it rather
 * than centred so the eye can run down the left margin and pick out the four
 * without reading anything.
 *
 * The id stays on the section, so /portfolio#merchandise still lands on the
 * right category — it scrolls there now instead of switching a tab to it.
 */
export const PortfolioSection = ({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) => (
  <section className={styles.section} id={id} aria-labelledby={`${id}-heading`}>
    <div className={styles.head}>
      <h2 className={styles.heading} id={`${id}-heading`}>
        {label}
      </h2>
      {/* Decorative: the heading already names the section, so the rule is
          nothing for a screen reader to announce. */}
      <span className={styles.rule} aria-hidden="true" />
    </div>
    {children}
  </section>
)
