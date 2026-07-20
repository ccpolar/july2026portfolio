import type { GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description: 'Every word on the homepage lives here.',
  },
  hooks: {
    afterChange: [revalidateEverything],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'heroLine',
              type: 'textarea',
              required: true,
              maxLength: 90,
              admin: {
                description:
                  'The first thing anyone reads. Short — it is set very large, and long copy will not sit well.',
              },
            },
            {
              name: 'heroIntro',
              type: 'textarea',
              required: true,
              maxLength: 260,
              admin: {
                description: 'One or two sentences under the headline.',
              },
            },
            {
              name: 'available',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Shows a small live dot and the label below.' },
            },
            {
              name: 'availabilityLabel',
              type: 'text',
              maxLength: 60,
              defaultValue: 'Available for new work',
              admin: {
                condition: (_, siblingData) => Boolean(siblingData?.available),
              },
            },
          ],
        },
        {
          label: 'Work',
          fields: [
            {
              name: 'workHeading',
              type: 'text',
              required: true,
              defaultValue: 'Selected work',
              maxLength: 60,
            },
            {
              name: 'workIntro',
              type: 'textarea',
              maxLength: 200,
              admin: { description: 'Optional. Leave blank to let the work start immediately.' },
            },
          ],
        },
        {
          label: 'Approach',
          fields: [
            {
              name: 'approachHeading',
              type: 'text',
              required: true,
              defaultValue: 'How this goes',
              maxLength: 60,
            },
            {
              name: 'approachBody',
              type: 'textarea',
              required: true,
              maxLength: 400,
            },
            {
              name: 'approachPoints',
              type: 'array',
              maxRows: 4,
              labels: { singular: 'Point', plural: 'Points' },
              admin: {
                description:
                  'The things that make you easy to work with. Three is the sweet spot.',
              },
              fields: [
                { name: 'title', type: 'text', required: true, maxLength: 48 },
                { name: 'detail', type: 'textarea', required: true, maxLength: 180 },
              ],
            },
          ],
        },
        {
          label: 'Blog page',
          description: 'The blog index at /blog. Posts themselves live under Content → Blog posts.',
          fields: [
            {
              name: 'blogHeading',
              type: 'text',
              required: true,
              defaultValue: 'Blog',
              maxLength: 60,
            },
            {
              name: 'blogIntro',
              type: 'textarea',
              maxLength: 240,
              admin: {
                description: 'Optional. A line under the heading on the blog page.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          description: 'The browser tab title lives under Site → Branding.',
          fields: [
            {
              name: 'metaDescription',
              type: 'textarea',
              required: true,
              maxLength: 165,
            },
          ],
        },
      ],
    },
  ],
}
