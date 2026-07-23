import type { CollectionConfig } from 'payload'

import { revalidatePortfolio, revalidatePortfolioDelete } from '../../hooks/revalidate'
import { imageField, orderField } from './shared'

export const Branding: CollectionConfig = {
  slug: 'branding',
  labels: { singular: 'Branding piece', plural: 'Branding work' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order'],
    group: 'Portfolio',
    description: 'Branding pieces, shown as a four-column grid on the portfolio page.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidatePortfolio],
    afterDelete: [revalidatePortfolioDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    imageField('The piece itself. Every cell in the grid is the same size, so consistent framing looks best.'),
    orderField,
  ],
}
