import type { CollectionConfig } from 'payload'

import { revalidateHome, revalidateHomeDelete } from '../hooks/revalidate'

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Client logo', plural: 'Client logos' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'logo', 'order'],
    group: 'Content',
    description:
      'The logos in the “Trusted by” strip under the homepage hero. They sit faded until hovered, so single-colour logos on a transparent background look most consistent.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateHome],
    afterDelete: [revalidateHomeDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 60,
      admin: { description: 'The business’s name. Read aloud by screen readers in place of the logo.' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'SVG or a transparent PNG, cropped close to the artwork — any empty margin around the logo makes it render smaller than its neighbours.',
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
