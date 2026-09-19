import type { GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

export const Legal: GlobalConfig = {
  slug: 'legal',
  label: 'Legal pages',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description:
      'Your Terms of Service and Privacy Policy. Each page, and its link in the footer, appears once it has text — leave one empty and it stays hidden.',
  },
  hooks: {
    // The footer's links follow these, and the footer is on every page.
    afterChange: [revalidateEverything],
  },
  fields: [
    {
      name: 'terms',
      type: 'richText',
      label: 'Terms of Service',
      admin: { description: 'Shown at /terms.' },
    },
    {
      name: 'privacy',
      type: 'richText',
      label: 'Privacy Policy',
      admin: { description: 'Shown at /privacy.' },
    },
  ],
}
