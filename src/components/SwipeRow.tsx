'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  children: ReactNode
  count: number
  /** What the cards are, for the dots' labels ("Services", "What clients say"). */
  label: string
  className: string
  dotsClassName: string
  dotClassName: string
}

/**
 * A row of cards that becomes a swipeable strip on phones. The swiping itself
 * is plain CSS scroll-snap on `className` — this only adds the dots under it,
 * which show where you are and jump to a card when tapped. Where the row isn't
 * scrollable (tablet and desktop grids), the dots are hidden by CSS and the
 * scroll listener has nothing to report.
 */
export const SwipeRow = ({ children, count, label, className, dotsClassName, dotClassName }: Props) => {
  const rowRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // The card whose left edge is nearest the row's own scroll position.
  const measure = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    const cards = [...row.children] as HTMLElement[]
    const start = row.scrollLeft + cards[0]?.offsetLeft
    let nearest = 0
    cards.forEach((card, i) => {
      if (Math.abs(card.offsetLeft - start) < Math.abs(cards[nearest].offsetLeft - start)) nearest = i
    })
    // Scrolled to the end, the last card can't reach the start edge; the
    // strip is then showing it, so it's the one to mark.
    if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) nearest = cards.length - 1
    setActive(nearest)
  }, [])

  // Only once the row has come to rest: mid-swipe there is no card to be on,
  // and marking whichever is nearest makes the dots flicker between states.
  // 'scrollend' is exact where it exists; the timer is the fallback.
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    measure()

    const settled = () => measure()
    const hasScrollEnd = 'onscrollend' in window
    let timer = 0
    const onScroll = () => {
      if (hasScrollEnd) return
      clearTimeout(timer)
      timer = window.setTimeout(settled, 120)
    }

    if (hasScrollEnd) row.addEventListener('scrollend', settled)
    row.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      row.removeEventListener('scrollend', settled)
      row.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [measure])

  const show = (index: number) => {
    const row = rowRef.current
    const card = row?.children[index] as HTMLElement | undefined
    if (!row || !card) return
    const first = row.children[0] as HTMLElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    row.scrollTo({ left: card.offsetLeft - first.offsetLeft, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <>
      <div className={className} ref={rowRef}>
        {children}
      </div>
      {count > 1 ? (
        <div className={dotsClassName} role="group" aria-label={`${label}: choose a card`}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              className={dotClassName}
              aria-label={`Show ${i + 1} of ${count}`}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => show(i)}
            />
          ))}
        </div>
      ) : null}
    </>
  )
}
