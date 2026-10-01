import type { PayloadRequest, Where } from 'payload'

import styles from './DashboardOverview.module.css'

/**
 * The admin's landing page: what's on the site, and the way back into
 * whatever was last touched.
 *
 * Payload's own dashboard lists every collection as an equal tile, which on
 * this site means sixteen of them — true, and useless. This counts the things
 * worth knowing and puts the work first.
 *
 * Every number here is counted from the database. Nothing is a trend or a
 * comparison, because there is nothing honest to compare against — the second
 * line on each tile is a real breakdown of the first.
 */
// A dashboard widget is handed the request; the payload instance and the
// signed-in user hang off it.
type Props = { req: PayloadRequest }

export const DashboardOverview = async ({ req }: Props) => {
  const { payload, user } = req

  const countOf = async (collection: string, where?: Where) => {
    try {
      const { totalDocs } = await payload.count({ collection: collection as never, where })
      return totalDocs
    } catch {
      // A collection that isn't there yet shouldn't take the dashboard down.
      return null
    }
  }

  const [work, featured, inPortfolio, snippets, posts, livePosts, services, liveServices, testimonials, moodboard] =
    await Promise.all([
      countOf('projects'),
      countOf('projects', { featured: { equals: true } }),
      countOf('projects', {
        category: { in: ['branding', 'merchandise', 'advertising', 'website'] },
      }),
      countOf('snippets'),
      countOf('posts'),
      countOf('posts', { published: { equals: true } }),
      countOf('services'),
      countOf('services', { published: { equals: true } }),
      countOf('testimonials'),
      countOf('moodboard'),
    ])

  const recent = await payload
    .find({ collection: 'projects', sort: '-updatedAt', limit: 5, depth: 0 })
    .then((result: { docs: { id: number | string; title?: string; updatedAt?: string }[] }) => result.docs)
    .catch(() => [])

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = (user as { name?: string; email?: string } | undefined)?.name?.split(' ')[0]
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const tiles = [
    {
      label: 'Work',
      count: work,
      meta:
        featured === null || inPortfolio === null
          ? null
          : `${featured} featured · ${inPortfolio} in portfolio`,
      href: '/admin/collections/projects',
      lead: true,
    },
    {
      label: 'Services',
      count: services,
      meta: liveServices === null ? null : `${liveServices} showing on the site`,
      href: '/admin/collections/services',
    },
    {
      label: 'Snippets',
      count: snippets,
      meta: null,
      href: '/admin/collections/snippets',
    },
    {
      label: 'Reviews',
      count: testimonials,
      meta: null,
      href: '/admin/collections/testimonials',
    },
    {
      label: 'Moodboard',
      count: moodboard,
      meta: null,
      href: '/admin/collections/moodboard',
    },
    {
      label: 'Posts',
      count: posts,
      meta: livePosts === null ? null : `${livePosts} published`,
      href: '/admin/collections/posts',
    },
  ].filter((tile) => tile.count !== null)

  const formatDate = (value?: string | null) => {
    if (!value) return ''
    const then = new Date(value).getTime()
    const minutes = Math.round((Date.now() - then) / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.round(hours / 24)
    return days < 30 ? `${days}d ago` : new Date(value).toLocaleDateString()
  }

  return (
    <div className={styles.overview}>
      <header className={styles.head}>
        <p className={styles.date}>{today}</p>
        <h1 className={styles.greeting}>
          {greeting}
          {name ? `, ${name}` : ''}
        </h1>
        <p className={styles.sub}>Everything on campagano.com, and the way back in.</p>
      </header>

      <div className={styles.tiles}>
        {tiles.map((tile) => (
          <a
            className={styles.tile}
            href={tile.href}
            key={tile.label}
            data-lead={tile.lead || undefined}
          >
            <span className={styles.tileLabel}>{tile.label}</span>
            <span className={styles.tileCount}>{tile.count}</span>
            {tile.meta ? <span className={styles.tileMeta}>{tile.meta}</span> : null}
            <span className={styles.tileGo} aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Recently edited</h2>
        {recent.length ? (
          <ul className={styles.recent}>
            {recent.map((doc) => (
              <li key={doc.id}>
                <a className={styles.recentLink} href={`/admin/collections/projects/${doc.id}`}>
                  <span className={styles.recentTitle}>{doc.title}</span>
                  <span className={styles.recentWhen}>{formatDate(doc.updatedAt)}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Nothing yet. Add your first piece of work below.</p>
        )}
      </section>

      <div className={styles.actions}>
        <a className={styles.action} href="/admin/collections/projects/create">
          New work
        </a>
        <a className={styles.actionQuiet} href="/admin/collections/snippets/create">
          New snippet
        </a>
        <a
          className={styles.actionQuiet}
          href="https://www.campagano.com"
          target="_blank"
          rel="noreferrer"
        >
          View the site
        </a>
      </div>
    </div>
  )
}
