import type { CollectionSlug, ServerProps } from 'payload'

import { DashboardLink } from './DashboardLink'
import styles from './NavBrand.module.css'

/** The sidebar links that carry a count, by the id Payload gives each one. */
const COUNTED: { id: string; collection: CollectionSlug }[] = [
  { id: 'nav-projects', collection: 'projects' },
  { id: 'nav-moodboard', collection: 'moodboard' },
  { id: 'nav-snippets', collection: 'snippets' },
  { id: 'nav-posts', collection: 'posts' },
  { id: 'nav-testimonials', collection: 'testimonials' },
  { id: 'nav-services', collection: 'services' },
]

const ExternalArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 17 17 7M8 7h9v9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * The head of the sidebar: whose site this is and the way out to it, then the
 * way back to the dashboard — the two things Payload's own nav starts without.
 *
 * It also fills in the count beside each collection that has one (Work 41,
 * Moodboard 9 …). Payload draws those links itself, so rather than replacing
 * them the counts are handed to its links as CSS content, keyed on the id
 * Payload already gives each link. The links stay Payload's; only the number
 * comes from here, and it is counted fresh on every page load.
 */
// A nav component is handed the server props, with the payload instance and
// the signed-in user on them directly.
export const NavBrand = async ({ payload, user }: ServerProps) => {
  const counts = await Promise.all(
    COUNTED.map(({ collection }) =>
      payload
        .count({ collection })
        .then((result) => result.totalDocs)
        .catch(() => null),
    ),
  )

  const siteTitle = await payload
    .findGlobal({ slug: 'identity', depth: 0 })
    .then((identity) => (identity as { browserTitle?: string })?.browserTitle)
    .catch(() => undefined)
  // The person signed in, by name; failing that, the site's own name.
  const name =
    (user as { name?: string | null } | null | undefined)?.name?.trim() ||
    siteTitle?.replace(/\s*[—–-]\s*.*$/, '').trim() ||
    'Campagano'

  const countRules = COUNTED.map(({ id }, i) =>
    counts[i] === null ? '' : `#${id}::after{content:"${counts[i]}"}`,
  ).join('')

  return (
    <div className={styles.head}>
      <style>{countRules}</style>

      <a
        className={styles.identity}
        href="https://www.campagano.com"
        target="_blank"
        rel="noreferrer"
        aria-label={`${name}, campagano.com (opens the site in a new tab)`}
      >
        <span className={styles.avatar} aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className={styles.words}>
          <span className={styles.name}>{name}</span>
          <span className={styles.site}>campagano.com</span>
        </span>
        <span className={styles.out}>
          <ExternalArrow />
        </span>
      </a>

      <DashboardLink />
    </div>
  )
}
