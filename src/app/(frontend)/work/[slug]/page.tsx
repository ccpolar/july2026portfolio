import config from '@payload-config'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'

import { MediaImage } from '@/components/MediaImage'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { liveSiteUrl } from '@/lib/portfolioItem'
import { projectTransitionName } from '@/lib/viewTransition'

import styles from './page.module.css'
import { ProjectStory } from './ProjectStory'

type Params = { params: Promise<{ slug: string }> }

const getProject = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const project = docs[0] ?? null

  // A draft's own page is the one place this can't just be a query filter: the
  // admin's Live Preview opens this exact URL to show unsaved changes, so a
  // draft has to still load for whoever is signed in, while staying a 404 for
  // everyone else. payload.auth reads the request's own cookies — same-origin,
  // so the preview pane already carries them — and builds the request object
  // itself, no manual plumbing needed. Skipped entirely for a live project, so
  // this adds no cost to the normal case.
  if (!project || project.status !== 'draft') return project
  const { user } = await payload.auth({ headers: await headers() })
  return user ? project : null
})

const getSiblings = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    where: {
      featured: { equals: true },
      status: { equals: 'live' },
    },
    sort: 'order',
    // depth 1 so the next project arrives with its cover — the end of a case
    // study is the last place to be showing a text link instead of the work.
    depth: 1,
    limit: 50,
  })
  // Only pieces that open a case study. A website opens the live site instead,
  // so stepping onto one with "Next project" would land on a page nothing else
  // on the site links to any more.
  return docs.filter((doc) => !liveSiteUrl(doc))
})

// No generateStaticParams: whether a draft opens depends on who's asking,
// which a prerendered page can't express — one cached HTML output can't be
// different for a visitor and a signed-in session. getProject's use of
// headers() makes Next render every case study on demand regardless, so a
// static param list would be contradictory as well as pointless here. See
// the comment on getProject above for the per-request check itself.

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: 'Not found' }

  // Optional now that a piece of work can be a picture with a name.
  const description = project.summary ?? undefined

  return {
    title: `${project.title} — Cam`,
    description,
    openGraph: { title: project.title, description, type: 'article' },
  }
}

const Arrow = ({ className, back }: { className?: string; back?: boolean }) => (
  <svg className={className} width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d={back ? 'M11 7H3M6.5 3.5 3 7l3.5 3.5' : 'M3 7h8M7.5 3.5 11 7l-3.5 3.5'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params
  const [project, chrome, siblings] = await Promise.all([
    getProject(slug),
    getChrome(),
    getSiblings(),
  ])

  if (!project) notFound()

  const index = siblings.findIndex((s) => s.slug === project.slug)
  const next = index >= 0 ? siblings[(index + 1) % siblings.length] : null
  const showNext = next && next.slug !== project.slug

  return (
    <>
      <SiteHeader {...chrome} />
      <main id="main">
        <ProjectStory project={project} email={chrome.email} />

        {showNext ? (
          <div className={`shell ${styles.next}`}>
            <a className={styles.nextLink} href={`/work/${next.slug}`}>
              {/* Carries the next project's own transition name, so continuing
                  through the work morphs the photograph forward the same way
                  arriving from the homepage did. */}
              <div
                className={styles.nextFrame}
                style={{ viewTransitionName: projectTransitionName(next.slug) }}
              >
                <MediaImage
                  className={styles.nextImage}
                  media={next.cover}
                  sizes="(min-width: 52rem) 22rem, 45vw"
                />
              </div>
              <span className={styles.nextText}>
                <span className={styles.nextLabel}>Next project</span>
                <span className={styles.nextTitle}>
                  {next.title}
                  <Arrow className={styles.nextArrow} />
                </span>
              </span>
            </a>
          </div>
        ) : null}
      </main>
      <SiteFooter siteName={chrome.siteName} />
    </>
  )
}
