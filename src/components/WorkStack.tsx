import type { CSSProperties } from 'react'

import type { Homepage, Project } from '@/payload-types'
import { projectTransitionName } from '@/lib/viewTransition'

import { ButtonLink } from './Button'
import { MediaImage } from './MediaImage'
import styles from './WorkStack.module.css'

type Props = {
  home: Homepage
  projects: Project[]
}

/** How many cards deep the stack keeps stepping down before it stops. Without
 *  a ceiling, a dozen featured pieces would push the last card most of the way
 *  down the screen before it ever pins. */
const MAX_DEPTH = 5

const Arrow = () => (
  <svg
    className={styles.cueArrow}
    width="12"
    height="12"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Recent work as a stack of cards that deal themselves out as you scroll.
 *
 * Each card pins a little lower than the one before it, so the card you have
 * just read stays put while the next one rides up over it, leaving a band of
 * the one beneath still showing — its title stays legible the whole way, so
 * you never lose track of what you are looking at.
 *
 * It is position: sticky doing the work, not a scroll listener, so it costs
 * nothing per frame and behaves on a trackpad, a wheel and a phone alike.
 */
export const WorkStack = ({ home, projects }: Props) => {
  if (!projects.length) return null

  return (
    <section className={`shell ${styles.section}`} id="work" aria-labelledby="work-heading">
      <div className={styles.head}>
        <h2 className={styles.heading} id="work-heading">
          {home.workHeading}
        </h2>
        {home.workIntro ? <p className={styles.intro}>{home.workIntro}</p> : null}
      </div>

      <div className={styles.stack}>
        {projects.map((project, i) => (
          <article
            className={styles.card}
            key={project.id}
            style={
              {
                // How far down this card pins, and which cards it covers.
                '--depth': Math.min(i, MAX_DEPTH),
                zIndex: i + 1,
              } as CSSProperties
            }
          >
            <a className={styles.link} href={`/work/${project.slug}`}>
              <div className={styles.text}>
                {/* The title sits alone at the top: it is the part that stays
                    showing in the band above the next card once this one is
                    pinned, so it has to be the first thing in the box. */}
                <h3 className={styles.title}>{project.title}</h3>

                <div className={styles.lower}>
                  {project.disciplines?.length ? (
                    <ul className={styles.tags}>
                      {project.disciplines.map((d, n) => (
                        <li className={styles.tag} key={`${d.label}-${n}`}>
                          {d.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {project.summary ? <p className={styles.summary}>{project.summary}</p> : null}

                  <span className={styles.cue}>
                    View project
                    <Arrow />
                  </span>
                </div>
              </div>

              <div
                className={styles.frame}
                // Pairs with the same photograph on the project page so it
                // moves between the two instead of being redrawn.
                style={{ viewTransitionName: projectTransitionName(project.slug) }}
              >
                <MediaImage
                  className={styles.image}
                  media={project.cover}
                  priority={i === 0}
                  sizes="(min-width: 52rem) 42rem, 100vw"
                />
              </div>
            </a>
          </article>
        ))}
      </div>

      {/* Recent work is a taste; the full portfolio is the meal. */}
      <div className={styles.more}>
        <ButtonLink href="/portfolio" withArrow>
          View full portfolio
        </ButtonLink>
      </div>
    </section>
  )
}
