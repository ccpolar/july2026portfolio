'use client'

import { RichText } from '@payloadcms/richtext-lexical/react'
import type { CSSProperties } from 'react'

import type { Media, Project } from '@/payload-types'

import { MediaImage } from './MediaImage'
import { useLightbox } from './portfolio/Lightbox'
import styles from './CaseStudyBlocks.module.css'

type Block = NonNullable<Project['layout']>[number]

const isMedia = (value: unknown): value is Media =>
  Boolean(value) && typeof value === 'object' && 'url' in (value as Media)

/** A YouTube or Vimeo page link turned into its embeddable form. */
const embedUrl = (raw: string): string | null => {
  const url = raw.trim()
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/)
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

const Caption = ({ text }: { text?: string | null }) =>
  text?.trim() ? <figcaption className={styles.caption}>{text}</figcaption> : null

/**
 * A long image or a PDF in a window the visitor scrolls inside, rather than
 * down the whole page.
 *
 * On a phone the window is shorter and the piece opens full size in a new tab
 * instead: a scrolling box inside a scrolling page is easy to get stuck in
 * when the whole screen is the box.
 */
const ScrollWindow = ({ block }: { block: Extract<Block, { blockType: 'scrollBlock' }> }) => {
  const isPdf = block.source === 'pdf'
  const doc = isPdf && block.document && typeof block.document === 'object' ? block.document : null
  const image = !isPdf && isMedia(block.image) ? block.image : null
  const href = isPdf ? doc?.url : (image?.url ?? null)
  if (!href) return null

  const height = Math.min(1000, Math.max(240, block.height ?? 560))

  return (
    <figure className={styles.block}>
      <div
        className={styles.scroll}
        style={{ '--window-height': `${height}px` } as CSSProperties}
      >
        {isPdf ? (
          <object className={styles.pdf} data={`${href}#toolbar=0&view=FitH`} type="application/pdf">
            <p className={styles.pdfFallback}>
              This PDF can’t be shown here. <a href={href}>Open it instead</a>.
            </p>
          </object>
        ) : (
          <MediaImage className={styles.long} media={image} sizes="(min-width: 64rem) 60rem, 100vw" />
        )}
      </div>

      <div className={styles.scrollFoot}>
        <Caption text={block.caption} />
        <a className={styles.openFull} href={href} target="_blank" rel="noreferrer noopener">
          {isPdf ? 'Open the PDF' : 'View full size'}
        </a>
      </div>
    </figure>
  )
}

const Video = ({ block }: { block: Extract<Block, { blockType: 'videoBlock' }> }) => {
  if (block.source === 'embed') {
    const src = block.url ? embedUrl(block.url) : null
    if (!src) return null
    return (
      <figure className={styles.block}>
        <div className={styles.videoFrame}>
          <iframe
            className={styles.embed}
            src={src}
            title={block.caption || 'Video'}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <Caption text={block.caption} />
      </figure>
    )
  }

  const video = block.video && typeof block.video === 'object' ? block.video : null
  if (!video?.url) return null
  const poster = isMedia(block.poster) ? (block.poster.sizes?.wide?.url ?? block.poster.url) : undefined

  return (
    <figure className={styles.block}>
      {/* A looping motion graphic plays itself, silently, and carries no
          controls; anything else is a normal video the visitor starts. Both
          keep their poster so the page isn't blank while it loads. */}
      <video
        className={styles.video}
        src={video.url}
        poster={poster ?? undefined}
        controls={!block.loop}
        autoPlay={Boolean(block.loop)}
        loop={Boolean(block.loop)}
        muted={Boolean(block.loop)}
        playsInline
        preload={block.loop ? 'auto' : 'metadata'}
        data-loop={block.loop ? 'true' : undefined}
      />
      <Caption text={block.caption} />
    </figure>
  )
}

const Grid = ({ block }: { block: Extract<Block, { blockType: 'gridBlock' }> }) => {
  const items = (block.items ?? []).filter((item) => isMedia(item.image))
  const { open, element } = useLightbox(
    items.map((item) => ({ id: item.id, caption: item.caption, image: item.image })),
  )
  if (!items.length) return null

  const gap = Math.min(64, Math.max(0, block.gap ?? 16))
  const shape = block.shape ?? 'natural'

  return (
    <div className={styles.block}>
      <ul
        className={styles.grid}
        data-shape={shape}
        style={{ '--columns': block.columns ?? '3', '--gap': `${gap}px` } as CSSProperties}
      >
        {items.map((item, i) => (
          <li className={styles.cell} key={item.id ?? i}>
            <figure className={styles.cellFigure}>
              <button
                type="button"
                className={styles.cellButton}
                onClick={() => open(i)}
                aria-label={item.caption ? `View ${item.caption} full screen` : 'View full screen'}
              >
                <MediaImage
                  className={styles.cellImage}
                  media={item.image}
                  sizes="(min-width: 64rem) 30rem, (min-width: 40rem) 45vw, 90vw"
                />
              </button>
              <Caption text={item.caption} />
            </figure>
          </li>
        ))}
      </ul>
      {element}
    </div>
  )
}

/** The blocks a case study is built from, in the order they were arranged. */
export const CaseStudyBlocks = ({ blocks }: { blocks?: Project['layout'] }) => {
  if (!blocks?.length) return null

  return (
    <div className={styles.blocks}>
      {blocks.map((block, i) => {
        const key = block.id ?? `${block.blockType}-${i}`

        switch (block.blockType) {
          case 'imageBlock':
            return (
              <figure className={`${styles.block} ${styles[block.width ?? 'full']}`} key={key}>
                <MediaImage
                  className={styles.image}
                  media={block.image}
                  sizes={block.width === 'half' ? '(min-width: 52rem) 45vw, 100vw' : '(min-width: 88rem) 88rem, 100vw'}
                />
                <Caption text={block.caption} />
              </figure>
            )
          case 'gridBlock':
            return <Grid block={block} key={key} />
          case 'scrollBlock':
            return <ScrollWindow block={block} key={key} />
          case 'videoBlock':
            return <Video block={block} key={key} />
          case 'textBlock':
            return block.content ? (
              <div className={`${styles.block} ${styles.text}`} key={key}>
                <RichText data={block.content} />
              </div>
            ) : null
          case 'quoteBlock':
            return (
              <figure className={`${styles.block} ${styles.quoteWrap}`} key={key}>
                <blockquote className={styles.quote}>{block.quote}</blockquote>
                {block.attribution ? (
                  <figcaption className={styles.attribution}>{block.attribution}</figcaption>
                ) : null}
              </figure>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
