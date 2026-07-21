import type { CollectionConfig } from 'payload'

import { revalidatePortfolio, revalidatePortfolioDelete } from '../../hooks/revalidate'
import { imageField, orderField } from './shared'

export const Merchandise: CollectionConfig = {
  slug: 'merchandise',
  labels: { singular: 'Merch item', plural: 'Merchandise' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order'],
    group: 'Portfolio',
    description:
      'Merchandise shots, shown as an auto-scrolling carousel on the portfolio page. Square or product-on-plain-background images read best.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidatePortfolio],
    afterDelete: [revalidatePortfolioDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    imageField('The product shot. It scrolls past in the carousel — consistent framing across items looks best.'),
    orderField,
  ],
}
