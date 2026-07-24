import type { CollectionConfig } from 'payload'

import { revalidatePortfolio, revalidatePortfolioDelete } from '../../hooks/revalidate'
import { imageField, orderField } from './shared'

export const Branding: CollectionConfig = {
  slug: 'branding',
  labels: { singular: 'Branding piece', plural: 'Branding work' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'order'],
    group: 'Portfolio',
    description:
      'Branding pieces, shown as wide stacked thumbnails on the portfolio page. Link one to a Recent Work project and its thumbnail becomes clickable, opening that project’s full case study.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidatePortfolio],
    afterDelete: [revalidatePortfolioDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    imageField('The piece itself — wide/landscape framing reads best here.'),
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      admin: {
        description:
          'Optional. The Recent Work project this piece belongs to. When set, clicking the thumbnail opens that project’s full case study. (Copying a project in from Recent Work sets this automatically.)',
      },
    },
    orderField,
  ],
}
