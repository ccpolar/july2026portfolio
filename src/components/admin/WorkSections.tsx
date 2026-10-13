import type { Payload } from 'payload'

import { PORTFOLIO_SECTIONS } from '@/lib/portfolioSections'

import styles from './WorkSections.module.css'

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

/**
 * Every section of the Portfolio page, above the Work list, each with how
 * many pieces are in it and a way to add one.
 *
 * The grouped list below only draws a group once something is in it, so a
 * section with nothing yet — Email Design, when it was new — had no presence
 * in the admin at all and no obvious way to start it. This row always shows
 * every section, empty or not, and "Add" opens a new piece already ticked
 * into that section (see the category field's defaultValue).
 *
 * It reads the sections from the same list the site does, so a section added
 * there appears here with no further work.
 */
export const WorkSections = async ({ payload }: { payload: Payload }) => {
  const counts = await Promise.all(
    PORTFOLIO_SECTIONS.map(({ value }) =>
      payload
        .count({ collection: 'projects', where: { category: { in: [value] } } })
        .then((result) => result.totalDocs)
        .catch(() => null),
    ),
  )

  // The grouped list heads each group with the section's stored value
  // ("email") rather than its name; Payload tags the heading with that value,
  // so the proper name can be put in its place from here, without a second
  // copy of the names to keep in step.
  const headingNames = PORTFOLIO_SECTIONS.map(
    ({ label, value }) =>
      `.group-by-header__heading[data-group-id="${value}"]{font-size:0}` +
      `.group-by-header__heading[data-group-id="${value}"]::before{content:${JSON.stringify(label)};font-size:var(--admin-group-heading-size,1.25rem)}`,
  ).join('')

  return (
    <section className={styles.sections} aria-labelledby="work-sections-heading">
      <style>{headingNames}</style>
      <h2 className={styles.heading} id="work-sections-heading">
        Portfolio sections
      </h2>
      <ul className={styles.list}>
        {PORTFOLIO_SECTIONS.map(({ label, value }, i) => {
          const count = counts[i]
          return (
            <li className={styles.section} key={value} data-empty={count === 0 ? '' : undefined}>
              <span className={styles.name}>{label}</span>
              <span className={styles.count}>
                {count === null
                  ? '—'
                  : count === 0
                    ? 'Nothing yet'
                    : `${count} ${count === 1 ? 'piece' : 'pieces'}`}
              </span>
              <a
                className={styles.add}
                href={`/admin/collections/projects/create?section=${value}`}
                aria-label={`Add a piece to ${label}`}
              >
                <PlusIcon />
                Add
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
