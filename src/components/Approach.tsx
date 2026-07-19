import type { Homepage } from '@/payload-types'

import styles from './Approach.module.css'

export const Approach = ({ home }: { home: Homepage }) => (
  <section className={styles.section} id="approach" aria-labelledby="approach-heading">
    <div className={`shell ${styles.grid}`}>
      <div>
        <h2 className={styles.heading} id="approach-heading">
          {home.approachHeading}
        </h2>
        <p className={styles.body}>{home.approachBody}</p>
      </div>

      {home.approachPoints?.length ? (
        <ul className={styles.points}>
          {home.approachPoints.map((point) => (
            <li className={styles.point} key={point.id ?? point.title}>
              <h3 className={styles.pointTitle}>{point.title}</h3>
              <p className={styles.pointDetail}>{point.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  </section>
)
