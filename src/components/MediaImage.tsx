import type { Media } from '@/payload-types'

import { MediaVideo } from './MediaVideo'

type Props = {
  media: number | Media | null | undefined
  sizes: string
  className?: string
  priority?: boolean
  /** Said instead when the upload has no alt text of its own. Alt text is
   *  optional in the admin, so a batch can be dropped in without naming each
   *  file; where it matters, the page describes the image from its context. */
  fallbackAlt?: string
}

const isMedia = (value: unknown): value is Media =>
  Boolean(value) && typeof value === 'object' && 'url' in (value as Media)

/**
 * Renders a Payload upload using the resized variants Payload already
 * generated, so the browser downloads the smallest file that fits the slot.
 * A video upload (MP4/WebM) renders as a looping, silent clip instead.
 */
export const MediaImage = ({ media, sizes, className, priority, fallbackAlt }: Props) => {
  if (!isMedia(media) || !media.url) return null

  // A video in the image library plays in the image's place.
  if (media.mimeType?.startsWith('video/')) {
    return (
      <MediaVideo
        className={className}
        src={media.url}
        label={media.alt?.trim() || fallbackAlt || ''}
        priority={priority}
      />
    )
  }

  const variants = [media.sizes?.thumb, media.sizes?.wide, media.sizes?.full]
    .filter((v): v is NonNullable<typeof v> => Boolean(v?.url && v?.width))
    .map((v) => `${v.url} ${v.width}w`)

  const srcSet = variants.length ? variants.join(', ') : undefined

  return (
    <img
      className={className}
      src={media.sizes?.wide?.url ?? media.url}
      srcSet={srcSet}
      sizes={sizes}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      alt={media.alt?.trim() || fallbackAlt || ''}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  )
}
