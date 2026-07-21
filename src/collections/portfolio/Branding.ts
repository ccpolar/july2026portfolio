import type { CollectionConfig } from 'payload'

import { revalidatePortfolio, revalidatePortfolioDelete } from '../../hooks/revalidate'
import { imageField, orderField } from './shared'

export const Branding: CollectionConfig = {
  slug: 'branding',
  labels: { singular: 'Branding piece', plural: 'Branding work' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'blockSize', 'order'],
    group: 'Portfolio',
    description:
      'Branding pieces, shown as draggable blocks on the portfolio page. The block size below varies the layout.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidatePortfolio],
    afterDelete: [revalidatePortfolioDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    imageField('The piece itself — any orientation. It fills its block.'),
    {
      name: 'blockSize',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
      admin: {
        description: 'How large this block sits in the gallery. Mix sizes for a lively wall.',
      },
    },
    orderField,
  ],
}
