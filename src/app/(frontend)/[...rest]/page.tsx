import { notFound } from 'next/navigation'

/**
 * Catches any URL that matches nothing else and hands it to the site's own 404.
 *
 * Without this, an unmatched URL falls through to `app/not-found.tsx`, which
 * sits above both root layouts and therefore renders with no stylesheet and no
 * fonts — a Times New Roman error page on a design portfolio. Routing the miss
 * through the (frontend) group instead means the 404 arrives inside the real
 * layout, with the type and theme it should have.
 *
 * Real routes win over a catch-all, so /work/<slug>, /admin and /api are
 * unaffected.
 */
export default function CatchAllNotFound(): never {
  notFound()
}
