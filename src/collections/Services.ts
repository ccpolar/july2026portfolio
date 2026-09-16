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
      'The cards in the homepage Services section. A service stays hidden until it has a description, so you can set one up before it goes live.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateHome],
    afterDelete: [revalidateHomeDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 40 },
    {
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            width: '60%',
            description:
              'An image or GIF for the top of the card. GIFs keep their animation. A landscape shape around 16:9 fits best.',
          },
        },
        {
          name: 'imageFit',
          type: 'select',
          defaultValue: 'fit',
          options: [
            { label: 'Show the whole image', value: 'fit' },
            { label: 'Fill the area (crops edges)', value: 'fill' },
          ],
          admin: {
            width: '40%',
            description: 'Illustrations usually want “whole image”; photos usually look better filled.',
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 320,
      admin: { description: 'Two or three sentences on what the client gets.' },
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
