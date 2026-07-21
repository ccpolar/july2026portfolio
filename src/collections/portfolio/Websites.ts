import type { CollectionConfig } from 'payload'

import { revalidatePortfolio, revalidatePortfolioDelete } from '../../hooks/revalidate'
import { orderField } from './shared'

export const Websites: CollectionConfig = {
  slug: 'websites',
  labels: { singular: 'Website', plural: 'Websites' },
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'liveUrl', 'order'],
    group: 'Portfolio',
    description:
      'Website design, shown inside a browser frame on the portfolio page. Upload a tall full-page screenshot — it scrolls inside the frame on hover.',
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidatePortfolio],
    afterDelete: [revalidatePortfolioDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'The project or client name.' } },
    {
      name: 'screenshot',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'A tall, full-page screenshot of the site (capture the whole page, not just the top). It sits inside the browser frame and scrolls on hover.',
      },
    },
    {
      name: 'liveUrl',
      type: 'text',
      admin: {
        description:
          'Optional. The real site address, e.g. https://example.com — shown in the frame’s address bar and makes the frame a link that opens the live site.',
      },
    },
    orderField,
  ],
}
