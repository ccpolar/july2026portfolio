import type { Field } from 'payload'

/**
 * Fields common to the portfolio categories. Each category is its own
 * collection (its own admin section) but they share this spine: a title, an
 * ordering number, and — for the image-led ones — a single image.
 */
export const orderField: Field = {
  name: 'order',
  type: 'number',
  defaultValue: 0,
  admin: {
    description: 'Lower numbers appear first.',
  },
}

export const imageField = (description: string): Field => ({
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  required: true,
  admin: { description },
})
