'use client'

import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import type { PortfolioItem } from '@/lib/portfolioItem'

import { MediaImage } from '../MediaImage'
import { useLightbox } from './Lightbox'
import styles from './MerchShowcase.module.css'

type Layout = 'carousel' | 'grid'

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CarouselIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="5" y="4" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2 6v8M18 6v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const GridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

/**
 * Apparel graphics as a carousel of square shots, one row you can page
 * through, with a small toggle that lays the whole set out as a grid instead.
 *
 * The carousel is the default: it shows the work at a size worth looking at
 * without the section taking several screens of scroll. The grid is for
 * seeing everything at once.
 *
 * Switching is a view transition: each shot carries its own name for the
 * length of the switch, so the browser moves every one from its place in the
 * row to its place in the grid rather than redrawing the section. Where view
 * transitions aren't supported, or less motion was asked for, it simply
 * switches.
 */
export const MerchShowcase = ({ items }: { items: PortfolioItem[] }) => {
  const { open, element } = useLightbox(items)
  const [layout, setLayout] = useState<Layout>('carousel')
  const [morphing, setMorphing] = useState(false)
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  // Whether the row can scroll further either way, so the arrows can say so.
  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track || layout !== 'carousel') return
    const max = track.scrollWidth - track.clientWidth
    setEdges({ start: track.scrollLeft <= 2, end: track.scrollLeft >= max - 2 })
  }, [layout])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges])

  // One step is most of a screenful of the row, so a press always shows
  // something new while keeping a sliver of what was there for continuity.
  const page = (dir: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: 'smooth' })
  }

  const switchTo = (next: Layout) => {
    if (next === layout) return
    const doc = document as ViewTransitionDocument
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!doc.startViewTransition || still) {
      setLayout(next)
      return
    }
    // Names go on for the switch only. Left on all the time they would
    // collide with the page-to-page transitions elsewhere on the site.
    // data-local-morph keeps the rest of the page from crossfading — see
    // globals.css.
    const root = document.documentElement
    root.setAttribute('data-local-morph', '')
    flushSync(() => setMorphing(true))
    const transition = doc.startViewTransition(() => {
      flushSync(() => setLayout(next))
    })
    void transition.finished.finally(() => {
      root.removeAttribute('data-local-morph')
      setMorphing(false)
    })
  }

  if (!items.length) return null

  return (
    <div className={styles.showcase} data-layout={layout}>
      <div className={styles.controls}>
        <div className={styles.toggle} role="group" aria-label="Show apparel graphics as">
          <button
            type="button"
            className={styles.toggleButton}
            aria-pressed={layout === 'carousel'}
            onClick={() => switchTo('carousel')}
          >
            <CarouselIcon />
            <span>Carousel</span>
          </button>
          <button
            type="button"
            className={styles.toggleButton}
            aria-pressed={layout === 'grid'}
            onClick={() => switchTo('grid')}
          >
            <GridIcon />
            <span>Grid</span>
          </button>
        </div>

        {layout === 'carousel' ? (
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => page(-1)}
              disabled={edges.start}
              aria-label="Previous"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => page(1)}
              disabled={edges.end}
              aria-label="Next"
            >
              <Chevron dir="right" />
            </button>
          </div>
        ) : null}
      </div>

      <ul
        className={styles.track}
        ref={trackRef}
        onScroll={updateEdges}
        data-morphing={morphing || undefined}
      >
        {items.map((item, index) => (
          <li
            className={styles.item}
            key={item.id}
            style={{ '--vt': `merch-${item.id}` } as CSSProperties}
          >
            <button
              type="button"
              className={styles.thumb}
              onClick={() => open(index)}
              aria-label={`View ${item.title} full size`}
            >
              <MediaImage
                className={styles.image}
                media={item.image}
                sizes="(min-width: 64rem) 20rem, 60vw"
              />
            </button>
          </li>
        ))}
      </ul>

      {element}
    </div>
  )
}
