import type { CollectionConfig } from 'payload'

import { revalidateHome, revalidateHomeDelete } from '../hooks/revalidate'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Service', plural: 'Services' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'order'],
    group: 'Content',
    description:
      'The cards in the homepage Services section. Untick “Show on the site” to work on one without it appearing.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateHome],
    afterDelete: [revalidateHomeDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 40 },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Show on the site',
      defaultValue: true,
      admin: {
        description: 'On by default. Untick to keep a service out of the Services section and the footer.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'An image or GIF for the top of the card. Any shape works — it’s scaled to sit whole inside the card’s dotted area, never cropped, with the dots showing around it. GIFs keep their animation, and a PNG keeps its transparency.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 320,
      admin: { description: 'Two or three sentences on what the client gets. Optional — a card without one shows its title and price.' },
    },
    {
      name: 'price',
      type: 'text',
      label: 'Pricing range',
      maxLength: 40,
      admin: {
        description: 'Written exactly as it should read — e.g. “$1,500 – $4,000”, “From $800”, or “Custom quote”. Leave blank to hide.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first.' },
    },
  ],
}
