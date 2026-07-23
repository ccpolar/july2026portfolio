import type { CollectionConfig } from 'payload'

import { revalidateMoodboard, revalidateMoodboardDelete } from '../hooks/revalidate'

export const Moodboard: CollectionConfig = {
  slug: 'moodboard',
  labels: { singular: 'Moodboard image', plural: 'Moodboard' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'blockSize', 'order'],
    group: 'Content',
    description:
      'Images on the moodboard page, where visitors can pick up and move the blocks around. Mix the block sizes for a livelier wall.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateMoodboard],
    afterDelete: [revalidateMoodboardDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Any orientation — it fills its block.' },
    },
    {
      name: 'blockSize',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
      admin: { description: 'How large this block sits on the board.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower numbers appear first (before anyone moves things).' },
    },
  ],
}
