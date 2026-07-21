import type { CollectionConfig } from 'payload'

import { revalidatePortfolio, revalidatePortfolioDelete } from '../../hooks/revalidate'
import { imageField, orderField } from './shared'

export const Advertising: CollectionConfig = {
  slug: 'advertising',
  labels: { singular: 'Advertising piece', plural: 'Advertising' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order'],
    group: 'Portfolio',
    description: 'Advertising design, shown as a gallery grid on the portfolio page.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidatePortfolio],
    afterDelete: [revalidatePortfolioDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    imageField('The ad or campaign image.'),
    {
      name: 'caption',
      type: 'text',
      maxLength: 120,
      admin: { description: 'Optional. A short line shown under the image.' },
    },
    orderField,
  ],
}
