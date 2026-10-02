import type { CollectionConfig } from 'payload'

import { revalidateProject, revalidateProjectDelete } from '../hooks/revalidate'
import { adminOrigin } from '../lib/previewUrl'
import { caseStudyBlocks } from './blocks'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const Projects: CollectionConfig = {
  slug: 'projects',
  // The slug stays 'projects' — this is the collection the four portfolio
  // collections were folded into, and their rows now live in this table.
  labels: { singular: 'Piece of work', plural: 'Work' },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'category', 'client', 'year', 'featured'],
    group: 'Work',
    description:
      'Every piece of work lives here, whatever it is, with the same tools on all of it. “Featured” puts a piece on the Recent Work page; the Portfolio sections put it on the Portfolio page. A piece can be in both, in several sections at once, or in none while it’s being written.',
    // The page itself, beside the fields, updating as you type. Saving is
    // still what puts a change live.
    livePreview: {
      // Absolute, and built from the admin's own request — the admin posts
      // its unsaved changes to this exact origin, so it has to match the host
      // you're actually on. A project with no slug yet previews the Recent
      // Work page rather than a 404.
      url: ({ data, req }) => `${adminOrigin(req)}${data?.slug ? `/work/${data.slug}` : '/work'}`,
      breakpoints: [
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
        { label: 'Tablet', name: 'tablet', width: 820, height: 1180 },
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
      ],
    },
  },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateProject],
    afterDelete: [revalidateProjectDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          description: 'What this piece of work is, and where on the site it appears.',
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
              name: 'status',
              type: 'select',
              defaultValue: 'live',
              options: [
                { label: 'Live', value: 'live' },
                { label: 'Draft', value: 'draft' },
              ],
              admin: {
                description:
                  'Draft takes this off Recent Work and the Portfolio, and its own page stops opening for visitors. You can still open it here and in Live Preview while signed in — it only hides from everyone else.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'client',
                  type: 'text',
                  admin: { width: '50%', description: 'Who it was for.' },
                },
                {
                  name: 'year',
                  type: 'number',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              // Several, not one: an identity that also became a run of shirts
              // belongs in two sections, and it should still be one piece of work
              // with one case study rather than two records of the same job.
              name: 'category',
              label: 'Portfolio sections',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'Branding', value: 'branding' },
                { label: 'Merchandise', value: 'merchandise' },
                { label: 'Advertising', value: 'advertising' },
                { label: 'Website', value: 'website' },
              ],
              admin: {
                description:
                  'Tick each section of the Portfolio page this should appear in. Leave them all unticked to keep it off that page. Separate from “Featured” above, which is the Recent Work page.',
              },
            },
            {
              name: 'liveUrl',
              type: 'text',
              label: 'Live site',
              admin: {
                condition: (data) => Boolean(data?.category?.includes?.('website')),
                description: 'Where “Visit site” sends people — e.g. https://example.com',
              },
            },
            {
              // No longer required: a merchandise piece or an ad is often just an
              // image and a title, and this line only appears on a Recent Work row.
              name: 'summary',
              type: 'textarea',
              maxLength: 220,
              admin: {
                description:
                  'One sentence on what this was. Shown on its Recent Work row and under it in the Advertising grid — keep it short; the image does the talking. Fine to leave empty.',
              },
            },
            {
              name: 'cover',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'The single decisive image for this project. Landscape works best.',
              },
            },
            {
              name: 'disciplines',
              type: 'array',
              labels: { singular: 'Discipline', plural: 'Disciplines' },
              admin: {
                // Three open rows was most of the scroll on this screen.
                initCollapsed: true,
                description:
                  'Short tags — e.g. Identity, Web Design, Art Direction. Two or three is plenty.',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'featured',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    width: '50%',
                    description: 'Show this piece on the Recent Work page (/work).',
                  },
                },
                {
                  name: 'order',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    width: '50%',
                    description:
                      'Lower numbers appear first — within Recent Work, and within each portfolio section.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Case study',
          description:
            'The write-up and the layout beneath it — on anything, wherever it appears. The preview beside you updates as you type.',
          fields: [
            {
              name: 'body',
              type: 'richText',
              admin: {
                description: 'Optional longer case study, shown on the project page.',
              },
            },
            {
              name: 'layout',
              type: 'blocks',
              label: 'Layout',
              blocks: caseStudyBlocks,
              admin: {
                description:
                  'Build the case study out of pieces: images, grids, a scrolling window for a long email design or PDF, video, text, pull quotes. Drag to reorder. These appear after the write-up above and before the Gallery below, and the preview beside you updates as you go.',
              },
            },
          ],
        },
        {
          label: 'Gallery',
          description:
            'The older stacked gallery. Still works; the Case study tab is the newer way to lay a project out.',
          fields: [
            {
              name: 'galleryGap',
              type: 'number',
              defaultValue: 48,
              min: 0,
              max: 96,
              label: 'Space between gallery images',
              admin: {
                description:
                  'The gap between the images below, in pixels. Set it to 0 when one artwork has been split across several files — the pieces then butt together with no seam.',
                components: {
                  Field: {
                    path: '/components/admin/RangeField#RangeField',
                    clientProps: { unit: 'px', fallback: 48 },
                  },
                },
              },
            },
            {
              name: 'gallery',
              type: 'array',
              labels: { singular: 'Image', plural: 'Gallery' },
              admin: {
                description:
                  'More images from the project, stacked below the write-up. Leave empty to show just the cover. Two half-width images in a row sit side by side.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                  maxLength: 120,
                  admin: {
                    description: 'Optional. A short line under the image.',
                  },
                },
                {
                  name: 'size',
                  type: 'select',
                  defaultValue: 'full',
                  options: [
                    { label: 'Full width', value: 'full' },
                    { label: 'Half width (pairs beside the next half)', value: 'half' },
                  ],
                  admin: {
                    description: 'Full images stand alone; two halves in a row share the width.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
