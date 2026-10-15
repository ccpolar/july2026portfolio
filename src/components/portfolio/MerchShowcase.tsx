'use client'

import { type CSSProperties, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import type { PortfolioItem } from '@/lib/portfolioItem'

import { MediaImage } from '../MediaImage'
import { useLightbox } from './Lightbox'
import styles from './MerchShowcase.module.css'
import { useDriftBelt } from './useDriftBelt'

type Layout = 'carousel' | 'grid'

/** Below this many shots one run of the belt can be narrower than the column,
 *  and the loop would show a gap — so a short set sits still as a row. */
const MIN_TO_DRIFT = 5

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
 * Apparel graphics as a carousel of square shots drifting past on their own,
 * with a small toggle that lays the whole set out as a grid instead.
 *
 * The carousel is the default: it shows the work at a size worth looking at
 * without the section taking several screens of scroll. It moves the way the
 * testimonials do, on a loop with no seam. It holds still while hovered or
 * focused so a shot can be looked at, can be grabbed and dragged either way,
 * and holds still entirely for anyone who asked for less motion. The grid is
 * for seeing everything at once.
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
  const beltRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)

  // The drift, the pause and the drag — see useDriftBelt.
  const drifts = items.length >= MIN_TO_DRIFT
  useDriftBelt({ beltRef, trackRef, enabled: layout === 'carousel' && drifts, count: items.length })

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
      </div>

      <div className={styles.belt} ref={beltRef} data-drifts={drifts || undefined}>
        <ul
          className={styles.track}
          ref={trackRef}
          data-morphing={morphing || undefined}
          style={{ '--count': items.length } as CSSProperties}
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
          {/* The belt's second copy, so the drift can loop without a seam —
            carousel only, hidden from screen readers and the keyboard, and
            with no transition names (two shots sharing a name would stop
            the switch to the grid from animating at all). */}
          {layout === 'carousel' && drifts
            ? items.map((item, index) => (
                <li
                  className={`${styles.item} ${styles.again}`}
                  key={`${item.id}-again`}
                  aria-hidden="true"
                >
                  <button
                    type="button"
                    className={styles.thumb}
                    tabIndex={-1}
                    onClick={() => open(index)}
                  >
                    <MediaImage
                      className={styles.image}
                      media={item.image}
                      sizes="(min-width: 64rem) 20rem, 60vw"
                    />
                  </button>
                </li>
              ))
            : null}
        </ul>
      </div>

      {element}
    </div>
  )
}
