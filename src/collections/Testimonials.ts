import type { CollectionConfig } from 'payload'

import { revalidateHome, revalidateHomeDelete } from '../hooks/revalidate'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'published'],
    group: 'Content',
    description:
      'Real words from real clients. If none are published, the homepage simply omits this section — it never shows an empty shell.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateHome],
    afterDelete: [revalidateHomeDelete],
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      maxLength: 320,
      admin: {
        description: 'Keep it to what they actually said. Shorter quotes land harder.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'role',
          type: 'text',
          admin: { width: '50%', description: 'e.g. Founder' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'company',
          type: 'text',
          admin: { width: '50%' },
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: { width: '50%', description: 'Lower numbers appear first.' },
        },
      ],
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Uncheck to hide without deleting.' },
    },
  ],
}
