import type { Metadata } from 'next'

import { NotFoundView } from '@/components/NotFoundView'
import { getChrome } from '@/lib/chrome'

/**
 * The 404 for URLs that match no route at all.
 *
 * This file has to exist for Next to stop serving its built-in 404 — a
 * not-found inside the (frontend) group alone never gets reached, because the
 * app has separate root layouts for the site and the admin. It must not open
 * its own <html>/<body>: Next already wraps this in a root layout, and doing
 * so nests a second document inside the first and breaks hydration.
 */
export const metadata: Metadata = {
  title: 'Nothing at this address — Cam',
}

export default async function RootNotFound() {
  const chrome = await getChrome()
  return <NotFoundView chrome={chrome} />
}
