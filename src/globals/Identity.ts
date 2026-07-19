import type { GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

export const Identity: GlobalConfig = {
  slug: 'identity',
  label: 'Logo & Name',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description: 'The site’s name, and an optional logo to show in the header instead of it.',
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
        description: 'Shown in the header when no logo is uploaded, and in the footer.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional. Replaces the name in the header. A wide logo with a transparent background works best — SVG or PNG.',
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
        condition: (data) => Boolean(data?.logo),
      },
    },
  ],
}
