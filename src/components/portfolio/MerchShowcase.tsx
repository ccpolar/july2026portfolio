'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'

import type { PortfolioItem } from '@/lib/portfolioItem'

import { MediaImage } from '../MediaImage'
import { useLightbox } from './Lightbox'
import styles from './MerchShowcase.module.css'

/** How far apart the stagger spreads the cards, and how many steps it runs for
 *  before they all leave together — a long grid shouldn't take twice as long
 *  to deal out as a short one. The step is wide enough that cards leave one
 *  at a time at a readable pace rather than in a single burst. */
const STEP_MS = 80
const MAX_STEPS = 10

/**
 * Merchandise as a grid of square shots, dealt out of a pile as you reach it.
 *
 * The grid itself is the resting state: it is laid out, visible and clickable
 * with no JavaScript at all. The animation is added on top — each card is told
 * how far it sits from the middle of the grid, and plays that journey in
 * reverse the first time the grid comes up the screen, so a stack in the
 * centre scatters out into the arrangement that was already there.
 *
 * It's deliberately only ever played once, and only when the grid starts out
 * below the fold: collapsing a grid someone is already looking at, to re-deal
 * it, would read as a glitch rather than as an entrance.
 */
export const MerchShowcase = ({ items }: { items: PortfolioItem[] }) => {
  const { open, element } = useLightbox(items)
  const gridRef = useRef<HTMLUListElement>(null)
  const [dealt, setDealt] = useState(false)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Already on screen when the page settled — this visitor has seen the grid
    // in place, so there's nothing to deal out to them.
    const box = grid.getBoundingClientRect()
    if (box.top < window.innerHeight) return

    const cards = [...grid.children] as HTMLElement[]

    // Where the pile sits. Across the grid, its middle. Down it, the grid's
    // middle only while that is somewhere the pile will actually be seen —
    // one column on a phone makes this grid several screens tall, and the
    // centre of it would put the pile a thousand pixels below the fold, so
    // every card would make its journey off-screen and simply be in place by
    // the time it was scrolled to. Past that, the pile moves up to sit just
    // inside the top of the grid, which is the part being looked at when the
    // deal starts.
    const measure = () => {
      const g = grid.getBoundingClientRect()
      const originX = g.left + g.width / 2
      const originY = g.top + Math.min(g.height / 2, window.innerHeight * 0.45)
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--dx', `${(originX - (r.left + r.width / 2)).toFixed(1)}px`)
        card.style.setProperty('--dy', `${(originY - (r.top + r.height / 2)).toFixed(1)}px`)
        // A pile is never perfectly square: a degree or two each way, fixed per
        // position so it's the same every time rather than random.
        card.style.setProperty('--rot', `${(((i % 5) - 2) * 1.6).toFixed(1)}deg`)
        card.style.setProperty('--step', `${Math.min(i, MAX_STEPS)}`)
      })
    }

    measure()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        // Re-measure immediately before playing: the column count may have
        // changed since mount if the window was resized on the way down.
        measure()
        setDealt(true)
        observer.disconnect()
      },
      // Fires as the grid's top edge just clears the bottom of the screen, so
      // the snap to the pile happens below the fold and only the scatter is
      // actually watched.
      { rootMargin: '0px 0px -72px 0px' },
    )
    observer.observe(grid)
    return () => observer.disconnect()
  }, [])

  if (!items.length) return null

  return (
    <>
      <ul
        className={styles.grid}
        ref={gridRef}
        data-dealt={dealt || undefined}
        style={{ '--step-ms': `${STEP_MS}ms` } as CSSProperties}
      >
        {items.map((item, index) => (
          <li className={styles.gridItem} key={item.id}>
            <button
              type="button"
              className={styles.thumb}
              onClick={() => open(index)}
              aria-label={`View ${item.title} full size`}
            >
              <MediaImage
                className={styles.image}
                media={item.image}
                sizes="(min-width: 64rem) 18rem, 33vw"
              />
            </button>
          </li>
        ))}
      </ul>

      {element}
    </>
  )
}
