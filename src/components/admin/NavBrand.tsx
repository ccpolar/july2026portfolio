import type { ServerProps } from 'payload'

import styles from './NavBrand.module.css'

/**
 * The head of the sidebar: whose site this is, whether it is live, and the way
 * out to it.
 *
 * Payload's nav starts straight in on a list of links, which is what makes the
 * panel feel like a stock install. This gives it a top — a mark, a name, and
 * one honest piece of status — before the sections begin.
 */
// A nav component is handed the server props, with the payload instance on
// them directly — unlike a dashboard widget, which is handed the request.
export const NavBrand = async ({ payload }: ServerProps) => {

  const siteName = await payload
    .findGlobal({ slug: 'identity', depth: 0 })
    .then((identity) => (identity as { browserTitle?: string })?.browserTitle)
    .catch(() => undefined)

  const name = (siteName || 'Campagano').replace(/\s*[—–-]\s*.*$/, '').trim()

  return (
    <div className={styles.brand}>
      <span className={styles.mark} aria-hidden="true">
        C
      </span>
      <span className={styles.words}>
        <span className={styles.name}>{name}</span>
        <a
          className={styles.site}
          href="https://www.campagano.com"
          target="_blank"
          rel="noreferrer"
        >
          <span className={styles.dot} aria-hidden="true" />
          campagano.com
        </a>
      </span>
    </div>
  )
}
