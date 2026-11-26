import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Library',
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
    // Short MP4/WebM clips go in the same library as images, so a video
    // can be used anywhere an image can: a cover, the gallery, the email and
    // advertising grids, image blocks. They play silently on a loop, like a
    // GIF. Resized variants are only made for images; videos are served as
    // uploaded, so keep them short and exported for the web.
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'],
  },
  fields: [
    {
      // Optional, so a whole batch of images can be dropped in and saved in
      // one go. Where it's left empty the site describes the image from its
      // context instead — a showcase email is read out as the project and
      // its place in the run (see MediaImage's fallbackAlt).
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'Optional. A short description of the image, read aloud by screen readers. Leave it empty and the site describes it from the project it belongs to.',
      },
    },
  ],
}
