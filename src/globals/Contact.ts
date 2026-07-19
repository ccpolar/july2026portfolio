import type { GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

export const Contact: GlobalConfig = {
  slug: 'contact',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description: 'The one obvious next step, and the softer fallback for people not ready yet.',
  },
  hooks: {
    afterChange: [revalidateEverything],
  },
  fields: [
    {
      name: 'heading',
      type: 'textarea',
      required: true,
      maxLength: 90,
      defaultValue: 'Let’s talk about what you’re making.',
    },
    {
      name: 'blurb',
      type: 'textarea',
      maxLength: 240,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          admin: { width: '50%', description: 'The primary call to action.' },
        },
        {
          name: 'bookingUrl',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Optional scheduling link (Cal.com, Calendly). Shown next to the email.',
          },
          validate: (value: unknown) => {
            if (!value) return true
            if (typeof value !== 'string') return 'Must be a URL.'
            try {
              const url = new URL(value)
              if (url.protocol !== 'https:') return 'Use an https:// link.'
              return true
            } catch {
              return 'Enter a full URL, including https://'
            }
          },
        },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      label: 'Newsletter — the fallback for visitors not ready to reach out',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'blurb',
          type: 'text',
          maxLength: 120,
          defaultValue: 'Occasional notes on new work. No more than a few times a year.',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
        },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      maxRows: 5,
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
