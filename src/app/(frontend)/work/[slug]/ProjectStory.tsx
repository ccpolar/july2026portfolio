'use client'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { useEffect, useState } from 'react'

import type { Media, Project } from '@/payload-types'
import { CaseStudyBlocks } from '@/components/CaseStudyBlocks'
import { MediaImage } from '@/components/MediaImage'
import { ProjectGallery } from '@/components/ProjectGallery'
import { usesShowcase } from '@/lib/portfolioItem'
import { projectTransitionName } from '@/lib/viewTransition'

import styles from './page.module.css'

const BackArrow = () => (
  <svg
    className={styles.backArrow}
    width="13"
    height="13"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M11 7H3M6.5 3.5 3 7l3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

type Props = { project: Project; email: string }

/** The column counts the showcase grid is laid out for: phone, tablet, desktop. */
const SHOWCASE_COLUMNS = [2, 3, 4] as const

/**
 * Deals the pieces into columns the way a masonry wall is built: each one goes
 * on whichever column is shortest so far. So the first row reads 1, 2, 3, 4
 * across, as the work was ordered, and the columns finish near the same
 * height — unlike CSS columns, which run 1, 2, 3 down the first column and
 * leave the last one empty when there are only a few pieces.
 *
 * Heights come from each image's own proportions, which Payload records on
 * upload, so this is worked out on the server with nothing measured in the
 * browser and nothing jumping once it loads.
 */
const masonry = (pieces: Media[], count: number) => {
  const columns: { media: Media; index: number }[][] = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)
  pieces.forEach((media, index) => {
    const ratio = media.width && media.height ? media.height / media.width : 1.5
    const shortest = heights.indexOf(Math.min(...heights))
    columns[shortest].push({ media, index })
    // The gap below each piece counts too, roughly — a few percent of a
    // column's width — so a run of short pieces isn't undercounted.
    heights[shortest] += ratio + 0.03
  })
  return columns
}

/** Where a showcase's back link returns to: the section it was opened from. */
const showcaseHome = (project: Project) =>
  project.category?.includes('email')
    ? { href: '/portfolio#email', label: 'Email Design' }
    : { href: '/portfolio#advertising', label: 'Advertising' }

/**
 * Email design and advertising: a run of finished pieces, so the page is built
 * to show all of them.
 *
 * The hero comes first and stands alone, then the brand, what was done for it
 * and the story — then every email (or ad) at full length in a masonry grid,
 * none of them cropped, since an email is read top to bottom and a cropped one
 * isn't the work any more. Whatever else the project has — layout blocks, the
 * older gallery — still follows underneath.
 */
const ShowcaseStory = ({ project }: Props) => {
  const home = showcaseHome(project)
  const services = project.disciplines?.map((d) => d.label).filter(Boolean) ?? []
  // The heading is usually the brand already; only say who it was for when
  // that's someone else (an agency job, a sub-brand).
  const client =
    project.client && project.client.trim().toLowerCase() !== project.title.trim().toLowerCase()
      ? project.client
      : null
  const pieces = (project.showcase ?? []).filter((m): m is Media => typeof m === 'object' && m !== null)
  // What one piece of the grid is called when an image has no alt text of
  // its own: "Guerrilla Golf, email 3 of 6".
  const pieceNoun = project.category?.includes('email') ? 'email' : 'piece'

  return (
    <>
      <div className={`shell ${styles.showcaseTop}`}>
        <a className={styles.back} href={home.href}>
          <BackArrow />
          {home.label}
        </a>
      </div>

      <div className="shell">
        <div
          className={styles.heroFrame}
          style={{ viewTransitionName: projectTransitionName(project.slug ?? '') }}
        >
          <MediaImage
            className={styles.image}
            media={project.cover}
            fallbackAlt={project.title}
            priority
            sizes="(min-width: 88rem) 88rem, 100vw"
          />
        </div>
      </div>

      <div className={`shell ${styles.showcaseIntro}`}>
        <h1 className={styles.showcaseTitle}>{project.title}</h1>

        {services.length ? (
          <p className={styles.services}>
            <span className={styles.servicesLabel}>Services</span>
            {services.join(', ')}
          </p>
        ) : null}

        {project.summary ? <p className={styles.showcaseSummary}>{project.summary}</p> : null}

        {project.body ? (
          <div className={styles.prose}>
            <RichText data={project.body} />
          </div>
        ) : null}

        {client || project.year ? (
          <div className={styles.facts}>
            {client ? (
              <div className={styles.fact}>
                <span className={styles.factLabel}>Client</span>
                <span className={styles.factValue}>{client}</span>
              </div>
            ) : null}
            {project.year ? (
              <div className={styles.fact}>
                <span className={styles.factLabel}>Year</span>
                <span className={styles.factValue}>{project.year}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {pieces.length ? (
        <div className={`shell ${styles.showcaseGridSection}`}>
          {/* One arrangement per screen width, and CSS shows the one that
              fits. The hidden ones cost almost nothing: a display:none image
              set to lazy-load is never fetched, and it's out of the
              accessibility tree, so nothing is read out three times. */}
          {SHOWCASE_COLUMNS.map((count) => (
            <div
              className={`${styles.showcaseGrid} ${styles[`showcaseCols${count}`]}`}
              key={count}
              role="list"
              aria-label={`${project.title} — the work`}
            >
              {masonry(pieces, count).map((column, c) => (
                <div className={styles.showcaseColumn} key={c}>
                  {column.map(({ media, index }) => (
                    <div className={styles.showcaseItem} role="listitem" key={`${media.id}-${index}`}>
                      <MediaImage
                        className={styles.showcaseImage}
                        media={media}
                        fallbackAlt={`${project.title}, ${pieceNoun} ${index + 1} of ${pieces.length}`}
                        sizes={`(min-width: 88rem) ${Math.round(88 / count)}rem, ${Math.round(96 / count)}vw`}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {project.layout?.length ? (
        <div className={`shell ${styles.body}`}>
          <CaseStudyBlocks blocks={project.layout} />
        </div>
      ) : null}

      {project.gallery?.length ? (
        <div className={`shell ${styles.gallerySection}`}>
          <ProjectGallery items={project.gallery} gap={project.galleryGap} />
        </div>
      ) : null}
    </>
  )
}

/** The case study itself, rendered from whatever data it's handed. */
const Story = ({ project, email }: Props) => {
  if (usesShowcase(project)) return <ShowcaseStory project={project} email={email} />

  const facts = [
    project.client ? { label: 'Client', value: project.client } : null,
    project.year ? { label: 'Year', value: String(project.year) } : null,
    project.disciplines?.length
      ? { label: 'Work', value: project.disciplines.map((d) => d.label).join(', ') }
      : null,
  ].filter((f): f is { label: string; value: string } => Boolean(f))

  return (
    <>
      <div className={`shell ${styles.header}`}>
        <a className={styles.back} href="/work">
          <BackArrow />
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
          style={{ viewTransitionName: projectTransitionName(project.slug ?? '') }}
        >
          <MediaImage
            className={styles.image}
            media={project.cover}
            fallbackAlt={project.title}
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
            directly. <a href={`mailto:${email}`}>Ask me about it</a>.
          </p>
        )}
      </div>

      {project.layout?.length ? (
        <div className={`shell ${styles.body}`}>
          <CaseStudyBlocks blocks={project.layout} />
        </div>
      ) : null}

      {project.gallery?.length ? (
        <div className={`shell ${styles.gallerySection}`}>
          <ProjectGallery items={project.gallery} gap={project.galleryGap} />
        </div>
      ) : null}
    </>
  )
}

/** Inside the admin's preview pane: the same story, re-rendered as fields change. */
const LiveStory = ({ project, email }: Props) => {
  const { data } = useLivePreview<Project>({
    initialData: project,
    // The admin frames this page from its own origin, so that's the origin
    // messages must come from.
    serverURL: window.location.origin,
    // Depth 1 so images and other linked records arrive resolved, the way the
    // page receives them from the server.
    depth: 1,
  })
  return <Story project={data} email={email} />
}

/**
 * The case study, and — only when the page is being shown inside the admin's
 * preview pane — a subscription to the editor's unsaved changes.
 *
 * A real visitor gets the plain render with no listener attached, the same
 * arrangement the theme preview uses.
 */
export const ProjectStory = ({ project, email }: Props) => {
  const [framed, setFramed] = useState(false)

  useEffect(() => {
    try {
      setFramed(window.self !== window.top)
    } catch {
      // Cross-origin framing throws on access — that still means we're framed.
      setFramed(true)
    }
  }, [])

  return framed ? (
    <LiveStory project={project} email={email} />
  ) : (
    <Story project={project} email={email} />
  )
}
