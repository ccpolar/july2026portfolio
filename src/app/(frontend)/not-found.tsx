import type { Metadata } from 'next'

import { NotFoundView } from '@/components/NotFoundView'
import { getContact } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Nothing at this address — Cam',
}

// Catches notFound() thrown inside the site (a project slug that no longer
// exists). Renders inside the (frontend) layout, so it already has the fonts
// and the theme.
export default async function NotFound() {
  const contact = await getContact()
  return <NotFoundView email={contact.email} />
}
