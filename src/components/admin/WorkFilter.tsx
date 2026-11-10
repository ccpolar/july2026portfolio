'use client'

import Link from 'next/link'
import { useState } from 'react'

import styles from './AdminDashboard.module.css'

export type WorkRow = {
  id: number | string
  title: string
  sections: string[]
  sectionNames: string
  client: string
  live: boolean
  edited: string
}

/**
 * Every piece of work in one table, narrowed by portfolio section with the
 * chips above it — all without leaving the dashboard.
 */
export const WorkFilter = ({
  rows,
  sections,
  admin,
}: {
  rows: WorkRow[]
  sections: { value: string; label: string; n: number }[]
  admin: string
}) => {
  const [section, setSection] = useState<string | null>(null)
  const shown = section ? rows.filter((r) => r.sections.includes(section)) : rows
  const current = sections.find((s) => s.value === section)

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter by portfolio section">
        <button
          type="button"
          className={styles.filter}
          aria-pressed={section === null}
          onClick={() => setSection(null)}
        >
          All <span>{rows.length}</span>
        </button>
        {sections.map((s) => (
          <button
            key={s.value}
            type="button"
            className={styles.filter}
            aria-pressed={section === s.value}
            onClick={() => setSection(s.value)}
          >
            {s.label} <span>{s.n}</span>
          </button>
        ))}
      </div>

      {shown.length ? (
        <div role="table" aria-label={current ? `${current.label} work` : 'All work'}>
          <div className={`${styles.tr} ${styles.trHead}`} role="row">
            <span className={styles.cTitle} role="columnheader">Title</span>
            <span className={styles.cSection} role="columnheader">Portfolio section</span>
            <span className={styles.cClient} role="columnheader">Client</span>
            <span className={styles.cStatus} role="columnheader">Status</span>
            <span className={styles.cEdited} role="columnheader">Edited</span>
          </div>
          {shown.map((row) => (
            <Link
              key={row.id}
              href={`${admin}/collections/projects/${row.id}`}
              className={styles.tr}
              role="row"
              prefetch={false}
            >
              <span className={styles.cTitle} role="cell">{row.title}</span>
              <span className={styles.cSection} role="cell">{row.sectionNames}</span>
              <span className={styles.cClient} role="cell">{row.client}</span>
              <span className={styles.cStatus} role="cell">
                <span className={`${styles.dot} ${row.live ? '' : styles.dotHollow}`} aria-hidden="true" />
                {row.live ? 'Live' : 'Draft'}
              </span>
              <span className={styles.cEdited} role="cell">{row.edited}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.emptyNote}>
          Nothing in {current?.label ?? 'this section'} yet.{' '}
          {current && (
            <Link href={`${admin}/collections/projects/create?section=${current.value}`} prefetch={false}>
              Add the first piece →
            </Link>
          )}
        </p>
      )}
    </>
  )
}
