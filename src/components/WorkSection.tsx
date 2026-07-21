import React from 'react'

import type { Homepage, Project } from '@/payload-types'
import { projectTransitionName } from '@/lib/viewTransition'

import { ButtonLink } from './Button'
import { MediaImage } from './MediaImage'
import styles from './WorkSection.module.css'

type Props = {
  home: Homepage
  projects: Project[]
}

const Facts = ({ project }: { project: Project }) => {
  const facts = [
    project.client,
    project.year ? String(project.year) : null,
    ...(project.disciplines?.map((d) => d.label) ?? []),
  ].filter((f): f is string => Boolean(f))

  if (!facts.length) return null

  return (
    <p className={styles.facts}>
      {facts.map((fact, i) => (
        <React.Fragment key={`${fact}-${i}`}>
          {i > 0 ? <span className={styles.sep} aria-hidden="true" /> : null}
          <span className={styles.fact}>{fact}</span>
        </React.Fragment>
      ))}
    </p>
  )
}

export const WorkSection = ({ home, projects }: Props) => {
  if (!projects.length) return null

  return (
    <section className={`shell ${styles.section}`} id="work" aria-labelledby="work-heading">
      <div className={styles.head}>
        <h2 className={styles.heading} id="work-heading">
          {home.workHeading}
        </h2>
        {home.workIntro ? <p className={styles.intro}>{home.workIntro}</p> : null}
      </div>

      <div className={styles.rows}>
        {projects.map((project, i) => (
          <a className={styles.row} key={project.id} href={`/work/${project.slug}`}>
            <div
              className={styles.frame}
              // Pairs with the same photograph on the project page so it moves
              // between the two instead of being redrawn.
              style={{ viewTransitionName: projectTransitionName(project.slug) }}
            >
              <MediaImage
                className={styles.image}
                media={project.cover}
                priority={i === 0}
                sizes={
                  i === 0
                    ? '(min-width: 52rem) 88rem, 100vw'
                    : '(min-width: 52rem) 50rem, 100vw'
                }
              />
            </div>
            <div className={styles.meta}>
              <div>
                <h3 className={styles.title}>{project.title}</h3>
                <Facts project={project} />
              </div>
              <div>
                <p className={styles.summary}>{project.summary}</p>
                <span className={styles.cue}>
                  View project
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
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Recent work is a taste; the full portfolio is the meal. This is the
          one obvious next step from the homepage into everything else. */}
      <div className={styles.more}>
        <ButtonLink href="/portfolio" withArrow>
          View full portfolio
        </ButtonLink>
      </div>
    </section>
  )
}
