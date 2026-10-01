import type { CollectionConfig } from 'payload'

/**
 * Video files for motion graphics, kept apart from the image library for the
 * same reason as PDFs. A case study can also point a video block at a YouTube
 * or Vimeo link instead, in which case nothing is uploaded here.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'filename', 'updatedAt'],
    group: 'Library',
    description:
      'Video files used inside case studies. MP4 plays everywhere; keep motion graphics short, since the file is served as-is. Add one to a case study with a Video block.',
  },
  upload: {
    staticDir: 'media/videos',
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'What this is, for your own reference.' },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional still shown before the video plays, and while it loads. Without one the first frame is used.',
      },
    },
  ],
}
