import type { CollectionConfig } from 'payload'

import { revalidateProject, revalidateProjectDelete } from '../hooks/revalidate'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const Projects: CollectionConfig = {
  slug: 'projects',
  // Slug stays 'projects' (no data migration); only the admin label changes.
  labels: { singular: 'Project', plural: 'Recent Work' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'year', 'featured'],
    group: 'Content',
    description:
      'Each project is one row on the homepage’s Recent Work. Drag to reorder — the order here is the order visitors see. Use “Add to portfolio” on a project to also show it in a portfolio category.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateProject],
    afterDelete: [revalidateProjectDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: { width: '60%' },
        },
        {
          name: 'slug',
          type: 'text',
          unique: true,
          index: true,
          admin: {
            width: '40%',
            description: 'Auto-filled from the title if left blank.',
          },
          hooks: {
            beforeValidate: [
              ({ value, data }) => {
                if (value) return slugify(value)
                if (data?.title) return slugify(data.title)
                return value
              },
            ],
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'client',
          type: 'text',
          admin: { width: '50%', description: 'Who it was for.' },
        },
        {
          name: 'year',
          type: 'number',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'disciplines',
      type: 'array',
      labels: { singular: 'Discipline', plural: 'Disciplines' },
      admin: {
        description: 'Short tags — e.g. Identity, Web Design, Art Direction. Two or three is plenty.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 220,
      admin: {
        description:
          'One sentence on what this project was. Shown on the homepage row — keep it short; the image does the talking.',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'The single decisive image for this project. Landscape works best.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      admin: {
        description: 'Optional longer case study, shown on the project page.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Image', plural: 'Gallery' },
      admin: {
        description:
          'More images from the project, stacked below the write-up. Leave empty to show just the cover. Two half-width images in a row sit side by side.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          maxLength: 120,
          admin: {
            description: 'Optional. A short line under the image.',
          },
        },
        {
          name: 'size',
          type: 'select',
          defaultValue: 'full',
          options: [
            { label: 'Full width', value: 'full' },
            { label: 'Half width (pairs beside the next half)', value: 'half' },
          ],
          admin: {
            description: 'Full images stand alone; two halves in a row share the width.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '50%',
            description: 'Show this project on the homepage.',
          },
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '50%',
            description: 'Lower numbers appear first.',
          },
        },
      ],
    },
    {
      // Presentational only — stores nothing. Renders the one-click "copy this
      // project into a portfolio category" control (see the component).
      name: 'transferToPortfolio',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/TransferToPortfolio#TransferToPortfolio',
        },
      },
    },
  ],
}
