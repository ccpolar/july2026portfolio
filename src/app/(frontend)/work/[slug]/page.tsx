import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import { cache } from 'react'

import { MediaImage } from '@/components/MediaImage'
import { ProjectGallery } from '@/components/ProjectGallery'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getChrome } from '@/lib/chrome'
import { projectTransitionName } from '@/lib/viewTransition'

import styles from './page.module.css'

type Params = { params: Promise<{ slug: string }> }

const getProject = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
})

const getSiblings = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { featured: { equals: true } },
    sort: 'order',
    // depth 1 so the next project arrives with its cover — the end of a case
    // study is the last place to be showing a text link instead of the work.
    depth: 1,
    limit: 50,
  })
  return docs
})

export async function generateStaticParams() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'projects', depth: 0, limit: 100 })
  return docs.filter((d) => d.slug).map((d) => ({ slug: d.slug as string }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: 'Not found' }

  return {
    title: `${project.title} — Cam`,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary, type: 'article' },
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

  const facts = [
    project.client ? { label: 'Client', value: project.client } : null,
    project.year ? { label: 'Year', value: String(project.year) } : null,
    project.disciplines?.length
      ? { label: 'Work', value: project.disciplines.map((d) => d.label).join(', ') }
      : null,
  ].filter((f): f is { label: string; value: string } => Boolean(f))

  return (
    <>
      <SiteHeader {...chrome} />
      <main>
        <div className={`shell ${styles.header}`}>
          <a className={styles.back} href="/#work">
            <Arrow className={styles.backArrow} back />
            All work
          </a>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.summary}>{project.summary}</p>

          {facts.length ? (
            <div className={styles.facts}>
              {facts.map((f) => (
                <div className={styles.fact} key={f.label}>
                  <span className={styles.factLabel}>{f.label}</span>
                  <span className={styles.factValue}>{f.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={`shell ${styles.cover}`}>
          <div
            className={styles.frame}
            style={{ viewTransitionName: projectTransitionName(project.slug) }}
          >
            <MediaImage
              className={styles.image}
              media={project.cover}
              priority
              sizes="(min-width: 88rem) 88rem, 100vw"
            />
          </div>
        </div>

        <div className={`shell ${styles.body}`}>
          {project.body ? (
            <div className={styles.prose}>
              <RichText data={project.body} />
            </div>
          ) : (
            <p className={styles.empty}>
              The full write-up for this one isn’t published yet — happy to walk you through it
              directly. <a href={`mailto:${chrome.email}`}>Ask me about it</a>.
            </p>
          )}
        </div>

        {project.gallery?.length ? (
          <div className={`shell ${styles.gallerySection}`}>
            <ProjectGallery items={project.gallery} />
          </div>
        ) : null}

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
