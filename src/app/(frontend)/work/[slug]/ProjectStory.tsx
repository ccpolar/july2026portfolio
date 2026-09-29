'use client'

import { RichText } from '@payloadcms/richtext-lexical/react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { useEffect, useState } from 'react'

import type { Project } from '@/payload-types'
import { MediaImage } from '@/components/MediaImage'
import { ProjectGallery } from '@/components/ProjectGallery'
import { projectTransitionName } from '@/lib/viewTransition'

import styles from './page.module.css'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

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

/** The case study itself, rendered from whatever data it's handed. */
const Story = ({ project, email }: Props) => {
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
    serverURL: SERVER_URL,
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
