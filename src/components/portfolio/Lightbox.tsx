'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Media } from '@/payload-types'

import { MediaImage } from '../MediaImage'
import styles from './Lightbox.module.css'

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** The shape any portfolio category can hand the lightbox. */
export type LightboxItem = {
  id?: string | number | null
  title?: string | null
  caption?: string | null
  image: number | Media | null | undefined
}

/**
 * A full-screen viewer shared by the portfolio categories: dark scrim, the
 * image scaled to fit, arrow keys / on-screen chevrons to move between pieces,
 * and Escape / backdrop / close button to dismiss.
 *
 * Returns the dialog to render plus an `open(index)` to trigger it, so each
 * category keeps its own thumbnail layout and none of them re-implement the
 * viewer.
 */
export const useLightbox = (items: LightboxItem[]) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState<number | null>(null)

  const open = useCallback((i: number) => {
    setIndex(i)
    dialogRef.current?.showModal()
  }, [])

  const move = useCallback(
    (dir: number) => {
      setIndex((current) =>
        current === null ? null : (current + dir + items.length) % items.length,
      )
    },
    [items.length],
  )

  // Arrow keys page through the set while the lightbox is open.
  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') move(1)
      else if (e.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, move])

  const active = index !== null ? items[index] : null

  const element = (
    <dialog
      ref={dialogRef}
      className={styles.lightbox}
      onClose={() => setIndex(null)}
      // Clicking the dark scrim (the dialog itself, not its inner content) closes.
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close()
      }}
    >
      {active ? (
        <>
          <button
            type="button"
            className={`${styles.control} ${styles.close}`}
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            <CloseIcon />
          </button>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.control} ${styles.prev}`}
                onClick={() => move(-1)}
                aria-label="Previous"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                className={`${styles.control} ${styles.next}`}
                onClick={() => move(1)}
                aria-label="Next"
              >
                <Chevron dir="right" />
              </button>
            </>
          ) : null}

          <figure className={styles.stage}>
            {/* key forces a fresh <img> per piece so the fade re-fires on move. */}
            <MediaImage
              key={active.id ?? index}
              className={styles.full}
              media={active.image}
              sizes="100vw"
            />
            {active.title || active.caption ? (
              <figcaption className={styles.stageCaption}>
                {active.title ? <span className={styles.stageTitle}>{active.title}</span> : null}
                {active.caption ? <span className={styles.stageNote}>{active.caption}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        </>
      ) : null}
    </dialog>
  )

  return { open, element }
}
