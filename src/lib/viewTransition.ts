/**
 * Names that tie an image on an index page to the same image on its own page,
 * so navigation morphs it between the two. Both sides must produce the
 * identical string or the browser has nothing to match and falls back to a
 * plain crossfade.
 *
 * Must be a valid CSS custom-ident: the prefix guarantees it never starts with
 * a digit, and anything a slug could contain beyond letters/digits/hyphens is
 * folded to a hyphen.
 */
const transitionName = (prefix: string, slug: string | null | undefined): string | undefined =>
  slug ? `${prefix}-${slug.replace(/[^a-zA-Z0-9-]/g, '-')}` : undefined

export const projectTransitionName = (slug: string | null | undefined) =>
  transitionName('project', slug)

export const postTransitionName = (slug: string | null | undefined) => transitionName('post', slug)
