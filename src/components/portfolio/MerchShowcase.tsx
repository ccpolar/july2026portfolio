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

/** Timings for the switch, in ms. */
const FADE = 200
const MOVE = 560
const ROW_STAGGER = 70
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE_IN = 'cubic-bezier(0.5, 0, 0.75, 0)'
/** The section's height eases in and out, so the page below it glides
 *  rather than lurching at the start the way a fast ease-out would. */
const EASE_HEIGHT = 'cubic-bezier(0.65, 0, 0.35, 1)'

const wait = (animations: Animation[]) =>
  Promise.all(animations.map((a) => a.finished.catch(() => undefined)))

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
 * Switching is choreographed by hand (the Web Animations API), not left to a
 * page-level view transition, which snapshotted the shots hidden past the
 * ends of the row and flew them in from outside the column:
 *
 *   carousel → grid  the shots cut off at the row's ends fade away; the ones
 *                    in full view glide to their places in the grid; the rest
 *                    come down out of the row into theirs, a row at a time;
 *                    and the section grows to its new height rather than
 *                    jumping, so the page below eases down with it.
 *   grid → carousel  the reverse: the lower rows fold up into the first and
 *                    fade, the section closes up to a single row, and the
 *                    first few shots glide back into the carousel.
 *
 * Without the API, or for anyone who asked for less motion, it just switches.
 */
export const MerchShowcase = ({ items }: { items: PortfolioItem[] }) => {
  const { open, element } = useLightbox(items)
  const [layout, setLayout] = useState<Layout>('carousel')
  const [animating, setAnimating] = useState(false)
  const beltRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)

  // The drift, the pause and the drag — see useDriftBelt. It isn't paused
  // for the switch: stopping it hands the row back to its start, which would
  // move every shot out from under the animation. It stops by itself the
  // moment the grid is laid out, and starts again from the beginning of the
  // row on the way back, which is where the animation expects it.
  const drifts = items.length >= MIN_TO_DRIFT
  useDriftBelt({ beltRef, trackRef, enabled: layout === 'carousel' && drifts, count: items.length })

  const switchTo = async (next: Layout) => {
    if (next === layout || animating) return
    const belt = beltRef.current
    const track = trackRef.current
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!belt || !track || typeof track.animate !== 'function' || still) {
      setLayout(next)
      return
    }

    setAnimating(true)
    const shots = () => [...track.querySelectorAll<HTMLElement>(':scope > li[data-shot]')]
    const twins = () => [...track.querySelectorAll<HTMLElement>(':scope > li[data-twin]')]
    const beltBox = belt.getBoundingClientRect()
    const before = shots().map((el) => el.getBoundingClientRect())
    // In the row: at least a third of it showing between the row's ends, so
    // a shot the drift has nudged part-way past an edge still glides; only
    // the slivers at the very ends fade.
    const inRow = (r: DOMRect, box: DOMRect) =>
      Math.min(r.right, box.right) - Math.max(r.left, box.left) >= r.width * 0.35
    // The row's shots ride above the rest while the switch plays, so the
    // others slide out from behind them, and back in, rather than across.
    const lift = (el: HTMLElement) => {
      el.style.position = 'relative'
      el.style.zIndex = '1'
    }

    try {
      if (next === 'grid') {
        // Where each shot is seen from. The belt holds the run twice so it can
        // loop, and once it has drifted round, the shot on screen is often
        // the second copy while the first sits off past the edge; the shot
        // then starts its glide from wherever its copy was showing, so what
        // you see moves in one piece.
        const twinRects = twins().map((el) => el.getBoundingClientRect())
        const seenAt = before.map((r, i) =>
          inRow(r, beltBox) ? r : twinRects[i] && inRow(twinRects[i], beltBox) ? twinRects[i] : null,
        )

        // 1. The row's cut-off ends fade away, and so does every copy that
        // isn't standing in for its shot.
        const leaving = [
          ...twins().filter((_, i) => !(seenAt[i] && seenAt[i] === twinRects[i])),
          ...shots().filter((_, i) => seenAt[i] !== before[i]),
        ].map((el) =>
          el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.96)' }], {
            duration: FADE,
            easing: EASE_IN,
            fill: 'forwards',
          }),
        )
        await wait(leaving)

        // The row kept drifting through the fade, so take the shots' places
        // again now, the instant before they start to move.
        const shotNow = shots().map((el) => el.getBoundingClientRect())
        const twinNow = twins().map((el) => el.getBoundingClientRect())
        const startAt = seenAt.map((r, i) => (!r ? null : r === before[i] ? shotNow[i] : twinNow[i]))

        // 2. Lay out the grid, then play every shot from where it was.
        belt.style.height = `${beltBox.height}px`
        belt.style.overflow = 'clip'
        flushSync(() => setLayout('grid'))
        const fullHeight = track.getBoundingClientRect().height
        const after = shots().map((el) => el.getBoundingClientRect())
        const firstTop = after[0]?.top ?? 0
        const rowStep = after.find((r) => r.top > firstTop + 1)?.top ?? firstTop
        const rowHeight = Math.max(1, rowStep - firstTop)
        // The fade-outs have done their job; the entrances below take over
        // (in the same frame, so nothing shows in between).
        leaving.forEach((anim) => anim.cancel())

        const moves = shots().map((el, i) => {
          const from = startAt[i]
          const to = after[i]
          if (from) {
            // In view in the row: glide straight to its grid place.
            lift(el)
            const s = from.width / to.width
            return el.animate(
              [
                { transformOrigin: 'top left', transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${s})` },
                { transformOrigin: 'top left', transform: 'none' },
              ],
              { duration: MOVE, easing: EASE_OUT },
            )
          }
          // Everything else comes down out of the row, a row at a time.
          const row = Math.round((to.top - firstTop) / rowHeight)
          return el.animate(
            [
              // Unseen until it has cleared the row, so it never crosses a shot.
              { opacity: 0, transform: `translateY(${beltBox.top - to.top}px) scale(0.9)`, offset: 0 },
              { opacity: 0, offset: 0.3 },
              { opacity: 1, transform: 'none', offset: 1 },
            ],
            { duration: MOVE, delay: 60 + row * ROW_STAGGER, easing: EASE_OUT, fill: 'backwards' },
          )
        })
        const grow = belt.animate([{ height: `${beltBox.height}px` }, { height: `${fullHeight}px` }], {
          duration: MOVE + 120,
          easing: EASE_HEIGHT,
        })
        belt.style.height = ''
        await wait([...moves, grow])
      } else {
        // 1. Everything below the first row folds up behind it and fades.
        const firstTop = before[0]?.top ?? 0
        shots().forEach((el, i) => {
          if (before[i].top <= firstTop + 1) lift(el)
        })
        const folding = shots()
          .map((el, i) => ({ el, r: before[i] }))
          .filter(({ r }) => r.top > firstTop + 1)
          .map(({ el, r }, n, all) =>
            el.animate(
              [
                { opacity: 1, offset: 0 },
                // Gone before it reaches the row, so it never crosses a shot.
                { opacity: 0, offset: 0.7 },
                { opacity: 0, transform: `translateY(${firstTop - r.top}px) scale(0.9)`, offset: 1 },
              ],
              { duration: FADE + 80, delay: (all.length - 1 - n) * 12, easing: EASE_IN, fill: 'forwards' },
            ),
          )
        await wait(folding)

        // 2. Back to the row; the first shots glide home, the section closes up.
        belt.style.height = `${beltBox.height}px`
        flushSync(() => setLayout('carousel'))
        belt.style.height = ''
        const rowBox = belt.getBoundingClientRect()
        const after = shots().map((el) => el.getBoundingClientRect())
        folding.forEach((a) => a.cancel())

        const moves = shots().map((el, i) => {
          const from = before[i]
          const to = after[i]
          if (from.top <= firstTop + 1 && to.right > rowBox.left && to.left < rowBox.right) {
            lift(el)
            const s = from.width / to.width
            return el.animate(
              [
                { transformOrigin: 'top left', transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${s})` },
                { transformOrigin: 'top left', transform: 'none' },
              ],
              { duration: MOVE, easing: EASE_OUT },
            )
          }
          return el.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: FADE + 120,
            delay: MOVE * 0.4,
            easing: EASE_OUT,
            fill: 'backwards',
          })
        })
        const twinsIn = twins().map((el) =>
          el.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: FADE + 120,
            delay: MOVE * 0.4,
            easing: EASE_OUT,
            fill: 'backwards',
          }),
        )
        const shrink = belt.animate(
          [{ height: `${beltBox.height}px`, overflow: 'clip' }, { height: `${rowBox.height}px`, overflow: 'clip' }],
          { duration: MOVE, easing: EASE_HEIGHT },
        )
        await wait([...moves, ...twinsIn, shrink])
      }
    } finally {
      belt.style.height = ''
      belt.style.overflow = ''
      for (const el of [...shots(), ...twins()]) {
        el.getAnimations().forEach((a) => a.cancel())
        el.style.position = ''
        el.style.zIndex = ''
      }
      setAnimating(false)
    }
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
            onClick={() => void switchTo('carousel')}
          >
            <CarouselIcon />
            <span>Carousel</span>
          </button>
          <button
            type="button"
            className={styles.toggleButton}
            aria-pressed={layout === 'grid'}
            onClick={() => void switchTo('grid')}
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
          style={{ '--count': items.length } as CSSProperties}
        >
          {items.map((item, index) => (
            <li className={styles.item} key={item.id} data-shot>
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
            carousel only, hidden from screen readers and the keyboard. */}
          {layout === 'carousel' && drifts
            ? items.map((item, index) => (
                <li
                  className={`${styles.item} ${styles.again}`}
                  key={`${item.id}-again`}
                  aria-hidden="true"
                  data-twin
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
