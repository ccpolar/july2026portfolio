import Link from 'next/link'
import type { AdminViewServerProps, Where } from 'payload'

import type { Project } from '@/payload-types'
import { PORTFOLIO_SECTION_VALUES, PORTFOLIO_SECTIONS } from '@/lib/portfolioSections'

import styles from './AdminDashboard.module.css'

/** Cam's clock, not the server's: Vercel runs on UTC, which would greet him
 *  with "Still up" at four in the afternoon. */
const TIME_ZONE = 'America/Los_Angeles'

const greetingFor = (hour: number) =>
  hour < 5
    ? 'Still up,'
    : hour < 12
      ? 'Good morning,'
      : hour < 18
        ? 'Good afternoon,'
        : hour < 22
          ? 'Good evening,'
          : 'Still up,'

const timeAgo = (iso?: string | null) => {
  if (!iso) return ''
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

const sectionNames = (project: Project) =>
  (project.category ?? [])
    .map((value) => PORTFOLIO_SECTIONS.find((s) => s.value === value)?.label)
    .filter(Boolean)
    .join(', ') || '—'

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ArrowOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)

/**
 * The admin's landing page — the "alpine" dashboard.
 *
 * A hero with the greeting and the state of the work at a glance, three cards
 * (the work by portfolio section, the rest of the site's content, and what's
 * featured on Recent Work), then the pieces most recently edited.
 *
 * Every number is counted from the database on each visit; nothing is a
 * trend or a guess. It replaces Payload's dashboard view outright, so it
 * renders inside the admin's own frame — the sidebar stays Payload's.
 */
export const AdminDashboard = async ({ initPageResult }: AdminViewServerProps) => {
  const { payload, user } = initPageResult.req
  const ADMIN = payload.config.routes.admin

  const count = (collection: 'projects' | 'moodboard' | 'services' | 'testimonials' | 'snippets' | 'posts', where?: Where) =>
    payload
      .count({ collection, where })
      .then((result) => result.totalDocs)
      .catch(() => 0)

  const [work, drafts, inPortfolio, featured, moodboard, services, liveServices, reviews, snippets, posts, livePosts, recent, sectionCounts] =
    await Promise.all([
      count('projects'),
      count('projects', { status: { equals: 'draft' } }),
      count('projects', { category: { in: PORTFOLIO_SECTION_VALUES } }),
      // What Recent Work actually shows: featured, and live.
      payload
        .find({
          collection: 'projects',
          where: { featured: { equals: true }, status: { equals: 'live' } },
          sort: 'order',
          depth: 0,
          limit: 12,
        })
        .then((result) => result.docs)
        .catch(() => [] as Project[]),
      count('moodboard'),
      count('services'),
      count('services', { published: { equals: true } }),
      count('testimonials'),
      count('snippets'),
      count('posts'),
      count('posts', { published: { equals: true } }),
      payload
        .find({ collection: 'projects', sort: '-updatedAt', depth: 0, limit: 5 })
        .then((result) => result.docs)
        .catch(() => [] as Project[]),
      Promise.all(PORTFOLIO_SECTIONS.map((s) => count('projects', { category: { in: [s.value] } }))),
    ])

  const live = work - drafts

  // Biggest section first, so the bars read as a ranking; the empty ones last.
  const sections = PORTFOLIO_SECTIONS.map((s, i) => ({ ...s, n: sectionCounts[i] })).sort(
    (a, b) => b.n - a.n,
  )
  const largest = Math.max(1, ...sections.map((s) => s.n))

  const now = new Date()
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: TIME_ZONE }).format(now),
  )
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: TIME_ZONE,
  })

  const fullName = (user as { name?: string | null } | null)?.name?.trim() || ''
  const firstName = fullName.split(/\s+/)[0] || 'there'
  const initials =
    fullName
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'C'

  const content = [
    { name: 'Moodboard', desc: 'images pinned', n: moodboard, href: 'moodboard' },
    { name: 'Services', desc: `${liveServices} showing on the site`, n: services, href: 'services' },
    { name: 'Reviews', desc: 'client testimonials', n: reviews, href: 'testimonials' },
    { name: 'Snippets', desc: 'screengrabs with a note', n: snippets, href: 'snippets' },
    { name: 'Posts', desc: `${livePosts} published`, n: posts, href: 'posts' },
  ]

  return (
    <div className={styles.page} data-alpine-dashboard="">
      {/* — Hero — */}
      <section className={styles.hero} aria-labelledby="alp-greeting">
        <div className={styles.heroTop}>
          <span className={styles.date}>{dateLabel}</span>
          <div className={styles.tools}>
            <Link
              href={`${ADMIN}/collections/projects`}
              className={styles.glass}
              aria-label="Search work"
              prefetch={false}
            >
              <SearchIcon />
              <span className={styles.glassQuiet}>Search work</span>
            </Link>
            <Link
              href={`${ADMIN}/account`}
              className={styles.avatar}
              aria-label="Your account"
              prefetch={false}
            >
              {initials}
            </Link>
          </div>
        </div>

        <div className={styles.greeting}>
          <h1 id="alp-greeting">
            {greetingFor(hour)}
            <em>{firstName}</em>
          </h1>
          <div className={styles.chips}>
            <span className={styles.chip}>
              <span className={styles.chipDot} aria-hidden="true" /> Live <b>{live}</b>
            </span>
            <span className={styles.chip}>
              <span className={`${styles.chipDot} ${styles.chipDotHollow}`} aria-hidden="true" /> Draft{' '}
              <b>{drafts}</b>
            </span>
            <span className={styles.chip}>
              Featured <b>{featured.length}</b>
            </span>
          </div>
        </div>

        <div className={styles.heroBottom}>
          <nav className={styles.tabs} aria-label="Sections">
            <Link href={ADMIN} className={styles.tab} aria-current="page" prefetch={false}>
              Overview
            </Link>
            <Link href={`${ADMIN}/collections/projects`} className={styles.tab} prefetch={false}>
              Work
            </Link>
            <Link href={`${ADMIN}/collections/services`} className={styles.tab} prefetch={false}>
              Site content
            </Link>
            <Link href={`${ADMIN}/collections/media`} className={styles.tab} prefetch={false}>
              Library
            </Link>
            <Link href={`${ADMIN}/globals/homepage`} className={styles.tab} prefetch={false}>
              Site settings
            </Link>
          </nav>
          <div className={styles.actions}>
            <a href="https://www.campagano.com" target="_blank" rel="noreferrer" className={styles.glass}>
              View the site
            </a>
            <Link href={`${ADMIN}/collections/snippets/create`} className={styles.glass} prefetch={false}>
              New snippet
            </Link>
            <Link href={`${ADMIN}/collections/projects/create`} className={styles.primary} prefetch={false}>
              <PlusIcon />
              New work
            </Link>
          </div>
        </div>
      </section>

      {/* — Stats row — */}
      <div className={styles.row}>
        <section className={`${styles.card} ${styles.workCard}`} aria-labelledby="alp-work">
          <div className={styles.cardHead}>
            <h2 id="alp-work">Work</h2>
            <Link href={`${ADMIN}/collections/projects`} className={styles.headLink} prefetch={false}>
              Open collection
              <ArrowRight />
            </Link>
          </div>
          <div className={styles.bigNumber}>
            <strong>{work}</strong>
            <span>
              pieces of work
              <small>
                {inPortfolio} in portfolio · {featured.length} featured
              </small>
            </span>
          </div>
          <ul className={styles.bars}>
            {sections.map((s) => (
              <li key={s.value}>
                <Link
                  href={`${ADMIN}/collections/projects?where[category][in][0]=${s.value}`}
                  className={styles.bar}
                  data-empty={s.n === 0 || undefined}
                  prefetch={false}
                >
                  <span className={styles.barLabel}>{s.label}</span>
                  <span className={styles.barTrack}>
                    {s.n > 0 ? (
                      <span className={styles.barFill} style={{ width: `${(s.n / largest) * 100}%` }} />
                    ) : (
                      <span className={styles.barEmpty}>Nothing yet</span>
                    )}
                  </span>
                  <span className={styles.barValue}>{s.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.card} ${styles.contentCard}`} aria-labelledby="alp-content">
          <div className={styles.cardHead}>
            <h2 id="alp-content">Site content</h2>
            <span className={styles.headNote}>{content.length} collections</span>
          </div>
          <ul className={styles.contentList}>
            {content.map((row) => (
              <li key={row.name}>
                <Link
                  href={`${ADMIN}/collections/${row.href}`}
                  className={styles.contentRow}
                  data-zero={row.n === 0 || undefined}
                  prefetch={false}
                >
                  <span className={styles.contentName}>{row.name}</span>
                  <span className={styles.contentDesc}>{row.desc}</span>
                  <span className={styles.contentNum}>{row.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.card} ${styles.featured}`} aria-labelledby="alp-featured">
          <div className={styles.cardHead}>
            <h2 id="alp-featured">Featured on Recent Work</h2>
            <Link
              href={`${ADMIN}/collections/projects?where[featured][equals]=true`}
              className={styles.featuredGo}
              aria-label="Open the featured work"
              prefetch={false}
            >
              <ArrowOut />
            </Link>
          </div>
          <div className={styles.bigNumber}>
            <strong>{featured.length}</strong>
            <span>of {work} pieces</span>
          </div>
          {featured.length ? (
            <ul className={styles.featuredList}>
              {featured.map((doc) => (
                <li key={doc.id}>
                  <Link href={`${ADMIN}/collections/projects/${doc.id}`} prefetch={false}>
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.featuredEmpty}>Tick “Featured” on a piece to put it on Recent Work.</p>
          )}
        </section>
      </div>

      {/* — Recently edited — */}
      <section className={`${styles.card} ${styles.tableCard}`} aria-labelledby="alp-recent">
        <div className={styles.tableHead}>
          <h2 id="alp-recent">Recently edited</h2>
          <Link href={`${ADMIN}/collections/projects`} className={styles.pillInvert} prefetch={false}>
            View all work
          </Link>
        </div>
        {recent.length ? (
          <div role="table" aria-label="Recently edited work">
            <div className={`${styles.tr} ${styles.trHead}`} role="row">
              <span className={styles.cTitle} role="columnheader">Title</span>
              <span className={styles.cSection} role="columnheader">Portfolio section</span>
              <span className={styles.cClient} role="columnheader">Client</span>
              <span className={styles.cStatus} role="columnheader">Status</span>
              <span className={styles.cEdited} role="columnheader">Edited</span>
            </div>
            {recent.map((doc) => {
              const isLive = doc.status !== 'draft'
              return (
                <Link
                  key={doc.id}
                  href={`${ADMIN}/collections/projects/${doc.id}`}
                  className={styles.tr}
                  role="row"
                  prefetch={false}
                >
                  <span className={styles.cTitle} role="cell">{doc.title}</span>
                  <span className={styles.cSection} role="cell">{sectionNames(doc)}</span>
                  <span className={styles.cClient} role="cell">{doc.client?.trim() || '—'}</span>
                  <span className={styles.cStatus} role="cell">
                    <span className={`${styles.dot} ${isLive ? '' : styles.dotHollow}`} aria-hidden="true" />
                    {isLive ? 'Live' : 'Draft'}
                  </span>
                  <span className={styles.cEdited} role="cell">{timeAgo(doc.updatedAt)}</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className={styles.emptyNote}>Nothing yet. Add your first piece of work.</p>
        )}
      </section>
    </div>
  )
}
