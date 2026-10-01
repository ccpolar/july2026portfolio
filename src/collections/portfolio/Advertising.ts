import type { CollectionConfig } from 'payload'

import { revalidatePortfolio, revalidatePortfolioDelete } from '../../hooks/revalidate'
import { imageField, orderField } from './shared'

export const Advertising: CollectionConfig = {
  slug: 'advertising',
  labels: { singular: 'Advertising piece', plural: 'Advertising' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'project', 'order'],
    group: 'Work',
    description:
      'Advertising design, shown as a gallery grid on the portfolio page. Link a piece to a Recent Work project and its thumbnail opens that project’s full case study; an unlinked piece opens full screen as an image.',
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
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      admin: {
        description:
          'Optional. The Recent Work project this campaign belongs to — that’s where the case study itself is written. When set, clicking the thumbnail opens it. (Copying a project in from Recent Work sets this automatically.)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      maxLength: 120,
      admin: { description: 'Optional. A short line shown under the image.' },
    },
    orderField,
  ],
}
