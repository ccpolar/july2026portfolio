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
            {
              name: 'heroCards',
              type: 'array',
              label: 'Hero carousel',
              labels: { singular: 'Card', plural: 'Cards' },
              maxRows: 7,
              admin: {
                initCollapsed: true,
                description:
                  'A fan of photographs between the headline and the paragraph below it. They shuffle on their own, so every one gets its turn in the middle. Seven is the full spread; fewer simply makes a smaller fan, and none hides it altogether. Portrait crops sit best — they are shown tall.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            },
            {
              name: 'heroCardsShape',
              type: 'select',
              label: 'Card shape',
              defaultValue: 'natural',
              options: [
                { label: 'As uploaded', value: 'natural' },
                { label: 'Square', value: 'square' },
                { label: 'Portrait', value: 'portrait' },
                { label: 'Tall', value: 'tall' },
              ],
              admin: {
                condition: (_, siblingData) => Boolean(siblingData?.heroCards?.length),
                description:
                  'The shape every card is cut to. “As uploaded” leaves each picture at its own proportions. The taller shapes crop in from the sides — which is what gives the row real height when the photographs are widescreen, and what lets the setting below go further.',
              },
            },
            {
              name: 'heroCardsHeight',
              type: 'number',
              label: 'Carousel height',
              defaultValue: 100,
              min: 60,
              max: 180,
              admin: {
                condition: (_, siblingData) => Boolean(siblingData?.heroCards?.length),
                description:
                  'How tall the row stands, against its normal size. It will not grow past the width of the page — so if turning this up stops making a difference, the row has run out of room sideways, and a taller card shape above will buy more.',
                components: {
                  Field: {
                    path: '/components/admin/RangeField#RangeField',
                    clientProps: { unit: '%', fallback: 100 },
                  },
                },
              },
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Optional. Sits centred below the buttons.',
              },
            },
            {
              name: 'heroImageSize',
              type: 'number',
              defaultValue: 40,
              min: 24,
              max: 60,
              admin: {
                description: 'How much of the hero’s width the photo takes up, on wide screens.',
                condition: (_, siblingData) => Boolean(siblingData?.heroImage),
                components: {
                  Field: {
                    path: '/components/admin/RangeField#RangeField',
                    clientProps: { unit: '%' },
                  },
                },
              },
            },
          ],
        },
        {
          label: 'Trusted by',
          description: 'The logo strip under the hero. The logos themselves live under Content → Client logos; the strip hides itself until at least one is added.',
          fields: [
            {
              name: 'trustedHeading',
              type: 'text',
              maxLength: 80,
              defaultValue: 'Trusted by these businesses, and counting.',
            },
            {
              name: 'trustedMoreLabel',
              type: 'text',
              maxLength: 24,
              defaultValue: '+ More',
              admin: {
                description:
                  'The pill under the logos — e.g. “50+ More”. Leave blank to hide it.',
              },
            },
          ],
        },
        {
          label: 'Recent Work page',
          description: 'The heading and intro at the top of /work. The projects themselves live under Content → Recent Work.',
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
          label: 'Services',
          description: 'The heading above the service cards. The services themselves live under Content → Services.',
          fields: [
            {
              name: 'servicesHeading',
              type: 'text',
              maxLength: 60,
              defaultValue: 'Services',
            },
            {
              name: 'servicesIntro',
              type: 'textarea',
              maxLength: 200,
              admin: { description: 'Optional. One line under the heading.' },
            },
          ],
        },
        {
          label: 'Portfolio page',
          description:
            'The heading and the line under it at the top of /portfolio. The work itself lives under Portfolio.',
          fields: [
            {
              name: 'portfolioHeading',
              type: 'text',
              required: true,
              defaultValue: 'Portfolio',
              maxLength: 60,
            },
            {
              name: 'portfolioIntro',
              type: 'textarea',
              maxLength: 240,
              defaultValue:
                'Everything, sorted by what it is — branding, merchandise, advertising, and the web.',
              admin: { description: 'Optional. Leave blank to let the tabs start immediately.' },
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
