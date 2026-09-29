import type { CollectionConfig } from 'payload'

/**
 * PDFs, kept apart from the image library on purpose: Media converts every
 * upload to WebP and insists on alt text, neither of which makes sense for a
 * document. These are what a "scroll window" block shows when the piece is a
 * PDF rather than a long image.
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'PDF', plural: 'PDFs' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'filename', 'updatedAt'],
    group: 'Content',
    description:
      'PDFs used inside case studies — email designs, decks, one-sheets. Add one to a case study with a Scroll window block.',
  },
  upload: {
    staticDir: 'media/documents',
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'What this is, for your own reference — e.g. “Mafia Capsule email”.' },
    },
  ],
}
