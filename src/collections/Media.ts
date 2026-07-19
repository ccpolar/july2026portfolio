import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Content',
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      { name: 'thumb', width: 480, height: undefined, position: 'centre' },
      { name: 'wide', width: 1200, height: undefined, position: 'centre' },
      { name: 'full', width: 2000, height: undefined, position: 'centre' },
    ],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe the image the way you would to someone who cannot see it. This is read aloud by screen readers and shown if the image fails to load.',
      },
    },
  ],
}
