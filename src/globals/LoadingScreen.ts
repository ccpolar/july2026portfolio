import type { GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

export const LoadingScreen: GlobalConfig = {
  slug: 'loading-screen',
  label: 'Loading screen',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description:
      'The intro that plays over the first page someone opens in a visit: your images flash by under a dark layer while your logo grows, then it fades to the site. It plays once per visit, never for people who have reduced motion turned on, and it hides itself until at least one image is added.',
  },
  hooks: {
    afterChange: [revalidateEverything],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Show the loading screen',
      defaultValue: true,
    },
    {
      name: 'images',
      type: 'array',
      maxRows: 10,
      labels: { singular: 'Image', plural: 'Images' },
      admin: {
        description:
          'Up to 10, each on screen for half a second in this order — drag to reorder. Landscape photos at least 2000px wide look sharpest; they are shown filling the screen and cropped to fit.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
  ],
}
