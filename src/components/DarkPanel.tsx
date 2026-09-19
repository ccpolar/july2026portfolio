import { Children, type CSSProperties, type ReactNode } from 'react'

import styles from './DarkPanel.module.css'
import { SwipeRow } from './SwipeRow'

type PanelProps = {
  id: string
  heading: string
  intro?: string | null
  children: ReactNode
}

/**
 * The black panel shared by the homepage's card sections (Services,
 * Testimonials). One component, so every panel is the same width, colour and
 * heading treatment by construction rather than by keeping copies in sync.
 *
 * On a phone the cards run in a swipeable row rather than a tall stack, with
 * dots underneath; from tablet up they're the grid.
 */
export const DarkPanel = ({ id, heading, intro, children }: PanelProps) => (
  <section className={`shell ${styles.section}`} id={id} aria-labelledby={`${id}-heading`}>
    <div className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.heading} id={`${id}-heading`}>
          {heading}
        </h2>
        {intro ? <p className={styles.intro}>{intro}</p> : null}
      </div>
      <SwipeRow
        className={styles.grid}
        count={Children.count(children)}
        label={heading}
        dotsClassName={styles.dots}
        dotClassName={styles.dot}
      >
        {children}
      </SwipeRow>
    </div>
  </section>
)

/**
 * Class and placement for the card at `index` of `count`. Cards run in rows
 * of three on desktop, and a short last row widens to fill the width, so any
 * count lands as a complete composition (five sit three over two). At two
 * columns, an odd card out takes the full row.
 */
export const panelCard = (index: number, count: number, extraClass = '') => {
  const remainder = count % 3
  const lastRowStart = remainder ? count - remainder : count
  const span = index >= lastRowStart ? 6 / remainder : 2
  const lone = count % 2 === 1 && index === count - 1

  return {
    className: `${styles.card} ${lone ? styles.lone : ''} ${extraClass}`.trim(),
    style: { '--span': span } as CSSProperties,
  }
}
