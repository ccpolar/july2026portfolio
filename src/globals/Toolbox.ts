import type { GlobalConfig } from 'payload'

import { revalidateEverything } from '../hooks/revalidate'

/** The wording used until something else is saved. Kept here so the page
 *  and the admin fields start from the same words. */
export const TOOLBOX_DEFAULTS = {
  heading: 'Toolbox',
  intro: 'Small tools I reach for while designing. Free to use, nothing to sign up for.',
  colorifyUrl: 'https://www.colorify.studio',
} as const

export const Toolbox: GlobalConfig = {
  slug: 'toolbox',
  label: 'Toolbox',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
    description:
      'The Toolbox page at /toolbox: small web tools for visitors (a mesh gradient maker, a palette maker, QuickGrid for bento grids, and Liquid Light for animated liquid gradients). The tools themselves are built in; here you choose whether the page is shown and what it says at the top.',
  },
  hooks: {
    // The toolbox icon sits in the header, and the header is on every page.
    afterChange: [revalidateEverything],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Show the Toolbox',
      defaultValue: true,
      admin: {
        description:
          'On: the toolbox icon appears in the navigation bar and the page is live. Off: the icon and the footer link go, and /toolbox shows “page not found”.',
      },
    },
    {
      name: 'heading',
      type: 'text',
      label: 'Page heading',
      defaultValue: TOOLBOX_DEFAULTS.heading,
      maxLength: 40,
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Intro',
      defaultValue: TOOLBOX_DEFAULTS.intro,
      maxLength: 240,
      admin: { description: 'One or two sentences under the heading.' },
    },
    {
      name: 'colorifyUrl',
      type: 'text',
      label: 'Colorify link',
      defaultValue: TOOLBOX_DEFAULTS.colorifyUrl,
      admin: {
        description: 'Where the palette tool’s “Open the full Colorify” button goes.',
      },
      validate: (value: string | null | undefined) =>
        !value || /^https?:\/\/\S+$/.test(value) ? true : 'Enter a full web address, starting with https://',
    },
  ],
}
