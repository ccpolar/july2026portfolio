'use client'

import { type CSSProperties, useEffect, useState } from 'react'

import type { Homepage } from '@/payload-types'

import styles from './HeroCards.module.css'
import { MediaImage } from './MediaImage'

type Card = NonNullable<Homepage['heroCards']>[number]

/** How long each card holds the middle before the fan shuffles along. */
const TICK = 2000

/**
 * Where a card sits, given which position in the fan it currently holds.
 *
 * Everything is expressed in card widths rather than pixels, so the whole
 * arrangement scales with one number and keeps its proportions from a phone
 * to a wide display. `d` is the signed distance from the middle: negative to
 * the left, positive to the right, zero for the card in front.
 */
const place = (count: number, slot: number) => {
  const d = slot - (count - 1) / 2
  const a = Math.abs(d)
  return {
    x: d * 1.12,
    // Slightly more than linear, so the fan droops at the edges rather than
    // stepping down evenly — it reads as depth instead of a staircase.
    y: a ** 1.5 * 0.1,
    rotate: d * 4.2,
    scale: 1 - a * 0.125,
    // The middle card sits in front; each step out drops behind the last.
    z: 20 - Math.round(a * 2),
    ring: Math.round(a),
  }
}

type Props = { cards?: Card[] | null }

/**
 * The hero's fan of photographs, shuffling one place to the right every couple
 * of seconds so each picture takes its turn in the middle.
 *
 * The shuffle is a loop, which means one card has to get from the right-hand
 * end back to the left on every tick. That journey is hidden rather than
 * animated: both ends of the fan are faded well back, the card leaving fades
 * out over the last stretch of its stay, and the one arriving is placed with
 * no transition at all while it is still invisible, then fades up. Nothing is
 * ever seen crossing the middle.
 */
export const HeroCards = ({ cards }: Props) => {
  const items = (cards ?? []).filter(
    (card) => card?.image && typeof card.image === 'object' && card.image.url,
  )
  const count = items.length

  // Under four cards there is no fan worth shuffling, so it stays put.
  const shuffles = count >= 4
  const [offset, setOffset] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!shuffles || paused) return
    // Someone who has asked for less motion gets the fan, still, as a picture.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setOffset((o) => o + 1), TICK)
    return () => window.clearInterval(id)
  }, [shuffles, paused])

  if (!count) return null

  // The card that starts in the middle is the one worth fetching first.
  const firstMiddle = Math.floor((count - 1) / 2)

  return (
    <div
      className={styles.stage}
      style={{ '--tick': `${TICK}ms` } as CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-paused={paused || undefined}
    >
      <ul className={styles.deck}>
        {items.map((card, i) => {
          const slot = (i + offset) % count
          const { x, y, rotate, scale, z, ring } = place(count, slot)
          // The card in the first slot has just come round from the last one.
          const end = !shuffles ? undefined : slot === 0 ? 'in' : slot === count - 1 ? 'out' : undefined

          return (
            <li
              className={styles.slot}
              key={card.id ?? i}
              data-ring={ring}
              data-end={end}
              style={
                {
                  '--x': x,
                  '--y': y,
                  '--r': `${rotate}deg`,
                  '--s': scale,
                  zIndex: z,
                } as CSSProperties
              }
            >
              <figure className={styles.card}>
                <MediaImage
                  className={styles.image}
                  media={card.image}
                  priority={i === firstMiddle}
                  sizes="(min-width: 64rem) 9rem, 22vw"
                />
              </figure>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
