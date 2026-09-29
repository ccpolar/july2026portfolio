import type { Block } from 'payload'

/**
 * The pieces a case study is built from. Each is one entry in a project's
 * Layout field: add, drag to reorder, remove.
 *
 * A project's older Gallery field still works and still renders; these are an
 * additional way to build a page, not a replacement anyone has to migrate to.
 */

const caption = {
  name: 'caption',
  type: 'text',
  maxLength: 160,
  admin: { description: 'Optional. A short line under it.' },
} as const

export const ImageBlock: Block = {
  slug: 'imageBlock',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'full',
      options: [
        { label: 'Full width', value: 'full' },
        { label: 'Inset — narrower than the page', value: 'inset' },
        { label: 'Half — pairs with the next half', value: 'half' },
      ],
    },
    caption,
  ],
}

export const GridBlock: Block = {
  slug: 'gridBlock',
  labels: { singular: 'Image grid', plural: 'Image grids' },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'columns',
          type: 'select',
          defaultValue: '3',
          options: [
            { label: '2 across', value: '2' },
            { label: '3 across', value: '3' },
            { label: '4 across', value: '4' },
          ],
          admin: { width: '50%', description: 'Narrower screens use fewer, down to one on a phone.' },
        },
        {
          name: 'gap',
          type: 'number',
          defaultValue: 16,
          min: 0,
          max: 64,
          label: 'Space between',
          admin: {
            width: '50%',
            description: 'Set 0 to butt the pieces together with no seam.',
            components: {
              Field: {
                path: '/components/admin/RangeField#RangeField',
                clientProps: { unit: 'px', fallback: 16 },
              },
            },
          },
        },
      ],
    },
    {
      name: 'shape',
      type: 'select',
      defaultValue: 'natural',
      label: 'Tile shape',
      options: [
        { label: 'Natural — each piece keeps its own proportions', value: 'natural' },
        { label: 'Square', value: 'square' },
        { label: 'Landscape (4:3)', value: 'landscape' },
        { label: 'Widescreen (16:9)', value: 'wide' },
        { label: 'Portrait (4:5)', value: 'portrait' },
      ],
      admin: {
        description:
          'Natural leaves a mixed set looking ragged; a shape makes every tile match, cropping from the centre to fit.',
      },
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Piece', plural: 'Pieces' },
      admin: { description: 'Drag to reorder. Each one can be clicked to see it full screen.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', maxLength: 120, admin: { description: 'Optional.' } },
      ],
    },
  ],
}

export const ScrollBlock: Block = {
  slug: 'scrollBlock',
  labels: { singular: 'Scroll window', plural: 'Scroll windows' },
  fields: [
    {
      name: 'source',
      type: 'select',
      defaultValue: 'image',
      label: 'What to show',
      options: [
        { label: 'A long image', value: 'image' },
        { label: 'A PDF', value: 'pdf' },
      ],
      admin: {
        description:
          'A tall email design or one-sheet, shown in a window the visitor scrolls inside rather than down the whole page.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.source !== 'pdf',
        description: 'Export around 1400–1600px wide. Height can be as long as you like.',
      },
    },
    {
      name: 'document',
      type: 'upload',
      relationTo: 'documents',
      label: 'PDF',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'pdf',
        description: 'From Content → PDFs.',
      },
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 560,
      min: 240,
      max: 2000,
      label: 'Window height',
      admin: {
        description:
          'How tall the window is on a desktop — drag as far as 2000px for a long email you want seen in one go. Past the height of the screen the page itself starts scrolling too, so somewhere near 700–900 usually reads best. Phones cap it at roughly half the screen either way.',
        components: {
          Field: {
            path: '/components/admin/RangeField#RangeField',
            clientProps: { unit: 'px', fallback: 560 },
          },
        },
      },
    },
    caption,
  ],
}

export const VideoBlock: Block = {
  slug: 'videoBlock',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    {
      name: 'source',
      type: 'select',
      defaultValue: 'upload',
      label: 'Where it comes from',
      options: [
        { label: 'A file I uploaded', value: 'upload' },
        { label: 'A YouTube or Vimeo link', value: 'embed' },
      ],
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'videos',
      admin: {
        condition: (_, siblingData) => siblingData?.source !== 'embed',
        description: 'From Content → Videos.',
      },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Link',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'embed',
        description: 'Paste the page link — e.g. https://vimeo.com/123456789',
      },
      validate: (value: unknown, { siblingData }: { siblingData?: { source?: string } }) => {
        if (siblingData?.source !== 'embed') return true
        if (typeof value !== 'string' || !value.trim()) return 'Paste a YouTube or Vimeo link.'
        return /youtube\.com|youtu\.be|vimeo\.com/.test(value)
          ? true
          : 'That doesn’t look like a YouTube or Vimeo link.'
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.source !== 'embed',
        description: 'Optional still shown before it plays.',
      },
    },
    {
      name: 'loop',
      type: 'checkbox',
      label: 'Play silently on a loop',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.source !== 'embed',
        description:
          'For motion graphics: starts itself, no sound, no controls. Visitors who ask for reduced motion see the still instead.',
      },
    },
    caption,
  ],
}

export const TextBlock: Block = {
  slug: 'textBlock',
  labels: { singular: 'Text', plural: 'Text' },
  fields: [{ name: 'content', type: 'richText' }],
}

export const QuoteBlock: Block = {
  slug: 'quoteBlock',
  labels: { singular: 'Pull quote', plural: 'Pull quotes' },
  fields: [
    { name: 'quote', type: 'textarea', required: true, maxLength: 320 },
    {
      name: 'attribution',
      type: 'text',
      maxLength: 80,
      admin: { description: 'Optional. Who said it — e.g. “Ines Varga, Fold Coffee”.' },
    },
  ],
}

export const caseStudyBlocks = [
  ImageBlock,
  GridBlock,
  ScrollBlock,
  VideoBlock,
  TextBlock,
  QuoteBlock,
]
