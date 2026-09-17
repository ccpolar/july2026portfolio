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
      name: 'frameDuration',
      type: 'number',
      label: 'Speed — time on each image',
      defaultValue: 500,
      min: 150,
      max: 1500,
      admin: {
        description:
          'How long each image stays on screen, in milliseconds (1000 = one second). Lower is faster. The logo grows across the whole run, so it slows or speeds up to match.',
        components: {
          Field: {
            path: '/components/admin/RangeField#RangeField',
            clientProps: { unit: 'ms', fallback: 500 },
          },
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'overlayColor',
          type: 'text',
          label: 'Overlay colour',
          defaultValue: '#000000',
          validate: (value: unknown) =>
            value == null || value === '' || /^#[0-9a-fA-F]{6}$/.test(String(value))
              ? true
              : 'Use a 6-digit hex colour, like #000000.',
          admin: {
            width: '50%',
            description: 'The tint laid over the images, under the logo.',
            components: {
              Field: {
                path: '/components/admin/ColorField#ColorField',
                clientProps: { fallback: '#000000' },
              },
            },
          },
        },
        {
          name: 'overlayOpacity',
          type: 'number',
          label: 'Overlay opacity',
          defaultValue: 50,
          min: 0,
          max: 90,
          admin: {
            width: '50%',
            description: 'How strongly the tint covers the images. 0 shows them untouched.',
            components: {
              Field: {
                path: '/components/admin/RangeField#RangeField',
                clientProps: { unit: '%', fallback: 50 },
              },
            },
          },
        },
      ],
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
