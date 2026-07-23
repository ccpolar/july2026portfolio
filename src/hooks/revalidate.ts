import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'
import type { PayloadRequest } from 'payload'
import { revalidatePath } from 'next/cache'

/**
 * The site is prerendered, so without this an edit in /admin would not appear
 * until the next deploy. These hooks push the affected pages out of the cache
 * the moment you hit Save.
 *
 * revalidatePath only works inside a Next request scope. Seed scripts and CLI
 * runs have no such scope, so a failure here is expected and must never take
 * the write down with it.
 */
const flush = (req: PayloadRequest, paths: string[]) => {
  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch {
      req.payload.logger.debug(`Skipped revalidating ${path} (no request scope)`)
    }
  }
}

const projectPaths = (doc: { slug?: string | null }) => [
  '/',
  ...(doc?.slug ? [`/work/${doc.slug}`] : []),
]

export const revalidateProject: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  const paths = new Set([...projectPaths(doc), ...projectPaths(previousDoc ?? {})])
  flush(req, [...paths])
  return doc
}

export const revalidateProjectDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  flush(req, projectPaths(doc))
  return doc
}

export const revalidateHome: CollectionAfterChangeHook = ({ doc, req }) => {
  flush(req, ['/'])
  return doc
}

export const revalidateHomeDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  flush(req, ['/'])
  return doc
}

// '/' is included because the header's Blog link appears and disappears with
// the count of published posts.
const postPaths = (doc: { slug?: string | null }) => [
  '/',
  '/blog',
  ...(doc?.slug ? [`/blog/${doc.slug}`] : []),
]

export const revalidatePost: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  const paths = new Set([...postPaths(doc), ...postPaths(previousDoc ?? {})])
  flush(req, [...paths])
  return doc
}

export const revalidatePostDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  flush(req, postPaths(doc))
  return doc
}

// Every portfolio category renders on the /portfolio page, so any add/edit/
// delete in any of the four collections refreshes that one page.
export const revalidatePortfolio: CollectionAfterChangeHook = ({ doc, req }) => {
  flush(req, ['/portfolio'])
  return doc
}

export const revalidatePortfolioDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  flush(req, ['/portfolio'])
  return doc
}

export const revalidateMoodboard: CollectionAfterChangeHook = ({ doc, req }) => {
  flush(req, ['/moodboard'])
  return doc
}

export const revalidateMoodboardDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  flush(req, ['/moodboard'])
  return doc
}

// Theme and site copy touch every page, so the whole tree goes.
export const revalidateEverything: GlobalAfterChangeHook = ({ doc, req }) => {
  flush(req, ['/', '/blog'])
  for (const dynamic of ['/work/[slug]', '/blog/[slug]']) {
    try {
      revalidatePath(dynamic, 'page')
    } catch {
      req.payload.logger.debug(`Skipped revalidating ${dynamic} (no request scope)`)
    }
  }
  return doc
}
