import type { Field, GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

const hexValidate = (value: unknown): true | string => {
  if (typeof value !== 'string' || !value) return 'Pick a colour.'
  const s = value.replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(s) || /^[0-9a-fA-F]{3}$/.test(s)) return true
  return 'Use a hex colour like #12120c.'
}

// A hex colour field rendered with the swatch + wheel picker.
const colorField = (
  name: string,
  label: string,
  defaultValue: string,
  description: string,
): Field => ({
  name,
  type: 'text',
  label,
  required: true,
  defaultValue,
  validate: hexValidate,
  admin: {
    description,
    components: {
      Field: {
        path: '/components/admin/ColorField#ColorField',
        clientProps: { fallback: defaultValue },
      },
    },
  },
})

export const Theme: GlobalConfig = {
  slug: 'theme',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description:
      'Every colour on the site. Use each swatch to open a colour wheel, or type a hex code. The contrast panel below the neutrals updates live so you can see whether text stays readable. Toggle Live Preview (top right) to watch the homepage recolour as you edit.',
    livePreview: {
      url: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      openByDefault: true,
      breakpoints: [
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
        { label: 'Tablet', name: 'tablet', width: 820, height: 1180 },
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
      ],
    },
  },
  hooks: {
    afterChange: [revalidateEverything],
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Surface & text',
      admin: {
        initCollapsed: false,
        description: 'The neutrals the whole site is built on.',
      },
      fields: [
        colorField('background', 'Background', '#ffffff', 'The page background.'),
        colorField('text', 'Text', '#12120c', 'Headings and body copy. Must read clearly on the background.'),
        colorField(
          'mutedText',
          'Muted text',
          '#5e5e55',
          'Secondary text — captions, metadata, supporting lines.',
        ),
        colorField(
          'surface',
          'Surface',
          '#f6f6f2',
          'Tinted panels: the approach band and image frames. Usually a hair off the background.',
        ),
        colorField('border', 'Border', '#deded9', 'Hairlines and dividers.'),
        {
          name: 'contrastCheck',
          type: 'ui',
          admin: {
            components: {
              Field: '/components/admin/PaletteContrast#PaletteContrast',
            },
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Accents',
      admin: {
        initCollapsed: false,
        description: 'The two colours that carry the brand.',
      },
      fields: [
        colorField(
          'brandColor',
          'Brand',
          '#343519',
          'Buttons, links, emphasis, and the whole contact section. Text on it stays readable automatically — pick any colour.',
        ),
        colorField(
          'signalColor',
          'Signal',
          '#bfc824',
          'The single bright note — the “available for work” dot. Used only as a small mark, so it can be as vivid as you like.',
        ),
      ],
    },
    {
      name: 'radius',
      type: 'select',
      required: true,
      defaultValue: 'sharp',
      options: [
        { label: 'Sharp — no rounding', value: 'sharp' },
        { label: 'Soft — 4px', value: 'soft' },
        { label: 'Round — 10px', value: 'round' },
      ],
      admin: {
        description: 'Applies to buttons, inputs and image corners.',
      },
    },
  ],
}
