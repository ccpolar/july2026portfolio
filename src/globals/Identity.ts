import type { GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

export const Identity: GlobalConfig = {
  slug: 'identity',
  label: 'Branding',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description:
      'The site’s name and logo, the browser tab’s icon and title, and how each is used.',
  },
  hooks: {
    afterChange: [revalidateEverything],
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Cam',
      maxLength: 40,
      admin: {
        description: 'Shown in the header when no logo is uploaded (or it’s turned off below), and in the footer.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional. A wide logo with a transparent background works best — SVG or PNG.',
      },
    },
    {
      name: 'showLogo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Show the logo in the header instead of the site name.',
        condition: (data) => Boolean(data?.logo),
      },
    },
    {
      name: 'logoHeight',
      type: 'number',
      defaultValue: 28,
      min: 16,
      max: 56,
      admin: {
        description: 'How tall the logo renders in the header, in pixels.',
        condition: (data) => Boolean(data?.logo) && data?.showLogo !== false,
        components: {
          Field: {
            path: '/components/admin/RangeField#RangeField',
            clientProps: { unit: 'px' },
          },
        },
      },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Shown in the browser tab and bookmarks. Square and simple reads best — most browsers render it very small.',
      },
    },
    {
      name: 'browserTitle',
      type: 'text',
      required: true,
      maxLength: 70,
      defaultValue: 'Cam — Freelance designer',
      admin: {
        description:
          'The browser tab’s title, and the page title search engines see. Short reads best — under ~60 characters.',
      },
    },
  ],
}
