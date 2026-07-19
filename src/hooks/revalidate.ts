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

// Theme and site copy touch every page, so the whole tree goes.
export const revalidateEverything: GlobalAfterChangeHook = ({ doc, req }) => {
  flush(req, ['/'])
  try {
    revalidatePath('/work/[slug]', 'page')
  } catch {
    req.payload.logger.debug('Skipped revalidating project pages (no request scope)')
  }
  return doc
}
