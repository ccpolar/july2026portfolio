import type { Media, Project } from '@/payload-types'

/** One of the four sections of the portfolio page. */
export type PortfolioSection = NonNullable<Project['category']>[number]

/**
 * What a portfolio tile needs, whichever section it's in.
 *
 * The four sections used to be four collections with four different shapes,
 * which is why only two of them could open a case study. They're one
 * collection now — every piece of work is a project carrying the sections it
 * belongs in — so the four showcases take this one shape, and the same
 * editing tools reach all of them.
 */
export type PortfolioItem = {
  id: number | string
  title: string
  image: number | Media | null | undefined
  /** A short line under the image, where the section shows one. */
  caption?: string | null
  /** The case study, when there is one written. null means nothing to open. */
  href?: string | null
  /** Websites only: the live address, shown in the browser frame. */
  liveUrl?: string | null
}

type RichTextNode = { text?: string; children?: RichTextNode[] }

/** Lexical's "empty" value is a document containing one empty paragraph, so a
 *  truthiness check on `body` says yes to a field nobody has typed in. */
const hasText = (nodes?: RichTextNode[]): boolean =>
  Array.isArray(nodes) && nodes.some((node) => (node.text?.trim() ? true : hasText(node.children)))

/**
 * Whether this piece has anything to open — a write-up, a built layout, or
 * gallery images. A tile with nothing behind it stays a picture rather than
 * becoming a link to a page holding only its own cover.
 */
export const hasCaseStudy = (project: Project) =>
  Boolean(project.slug) &&
  (hasText((project.body as { root?: RichTextNode } | null | undefined)?.root?.children) ||
    Boolean(project.layout?.length) ||
    Boolean(project.gallery?.length))

export const toPortfolioItem = (project: Project): PortfolioItem => ({
  id: project.id,
  title: project.title,
  image: project.cover,
  caption: project.summary,
  href: hasCaseStudy(project) ? `/work/${project.slug}` : null,
  liveUrl: project.liveUrl,
})
