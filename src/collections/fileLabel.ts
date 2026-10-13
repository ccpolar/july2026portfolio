import type { FieldHook, TextField } from 'payload'

/** "mafia-capsule_email-v2.pdf" → "Mafia capsule email v2" */
const fromFilename = (filename: unknown): string | undefined => {
  if (typeof filename !== 'string' || !filename.trim()) return undefined
  const words = filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : undefined
}

/**
 * Left empty, a file's label is filled in from its filename when it's saved.
 *
 * The label is what names the file in the admin, so it shouldn't be blank —
 * but making it required meant every file in a dragged-in batch had to be
 * named by hand before any of them would save. The filename is a good enough
 * name to start from, and can still be changed afterwards.
 */
const fillFromFilename: FieldHook = ({ value, data, originalDoc }) => {
  if (typeof value === 'string' && value.trim()) return value
  return fromFilename(data?.filename) ?? fromFilename(originalDoc?.filename) ?? value
}

export const fileLabelField = (description: string): TextField => ({
  name: 'label',
  type: 'text',
  admin: { description: `${description} Leave it empty to use the filename.` },
  hooks: { beforeChange: [fillFromFilename] },
})
