import type { CollectionConfig } from 'payload'

import { revalidatePost, revalidatePostDelete } from '../hooks/revalidate'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog posts' },
  access: {
    // Public requests only ever see published posts; logged-in admins see all.
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'published'],
    group: 'Content',
    description:
      'Posts on the blog page. The Blog link only appears in the site header once at least one post is published.',
  },
  defaultSort: '-publishedAt',
  hooks: {
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostDelete],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: { width: '60%' },
        },
        {
          name: 'slug',
          type: 'text',
          unique: true,
          index: true,
          admin: {
            width: '40%',
            description: 'Auto-filled from the title if left blank.',
          },
          hooks: {
            beforeValidate: [
              ({ value, data }) => {
                if (value) return slugify(value)
                if (data?.title) return slugify(data.title)
                return value
              },
            ],
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'publishedAt',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'MMM d, yyyy' },
            description: 'Posts are ordered newest first by this date.',
          },
        },
        {
          name: 'published',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '50%',
            description: 'Untick to keep a draft hidden from the site.',
          },
        },
      ],
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: {
        description: 'One or two sentences shown on the blog page under the title.',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional. Shown on the blog page and at the top of the post.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
  ],
}
