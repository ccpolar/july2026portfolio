import type { CollectionConfig } from 'payload'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'createdAt'],
    group: 'Content',
    description: 'People who asked to hear about new work. Export or delete any time.',
  },
  access: {
    // Sign-ups are created through the newsletter server action, which uses
    // Payload's local API and bypasses this. Nothing public may read or write.
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'homepage',
      admin: { readOnly: true },
    },
  ],
}
