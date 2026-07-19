/**
 * The name that ties a project's photograph in a work row to the same
 * photograph on its own page. Both sides must produce the identical string or
 * the browser has nothing to match and falls back to a plain crossfade.
 *
 * Must be a valid CSS custom-ident: the `project-` prefix guarantees it never
 * starts with a digit, and anything a slug could contain beyond
 * letters/digits/hyphens is folded to a hyphen.
 */
export const projectTransitionName = (slug: string | null | undefined): string | undefined =>
  slug ? `project-${slug.replace(/[^a-zA-Z0-9-]/g, '-')}` : undefined
