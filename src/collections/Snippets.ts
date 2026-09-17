import type { CollectionConfig } from 'payload'

import { revalidateSnippets, revalidateSnippetsDelete } from '../hooks/revalidate'

export const Snippets: CollectionConfig = {
  slug: 'snippets',
  labels: { singular: 'Snippet', plural: 'Snippets' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'note', 'order'],
    group: 'Content',
    description:
      'Screengrabs of work in progress, shown on the Snippets page. Each one is a 16:9 thumbnail visitors can click to enlarge, with a short note underneath.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateSnippets],
    afterDelete: [revalidateSnippetsDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'For your own reference, and read aloud by screen readers.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'The screengrab. Thumbnails are 16:9, so a widescreen crop fills the frame — anything else is centred and cropped to fit. The full image is what opens when it’s clicked.',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      maxLength: 200,
      admin: {
        description: 'A sentence or two shown in the bubble under the image. Leave blank for none.',
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
