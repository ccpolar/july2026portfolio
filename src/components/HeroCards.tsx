'use client'

import { type CSSProperties, useEffect, useState } from 'react'

import type { Homepage, Media } from '@/payload-types'

import styles from './HeroCards.module.css'
import { MediaImage } from './MediaImage'

type Card = NonNullable<Homepage['heroCards']>[number]

/** How long each card holds the middle before the row shuffles along. */
const TICK = 2000

/**
 * How big a card is, by how many places it sits from the middle.
 *
 * Measured off the reference: a steep, near-linear fall-off — the middle
 * card is several times the width of the ones at the ends, which is what
 * stops the row reading as a plain filmstrip.
 */
const scaleFor = (ring: number) => Math.max(0.18, 1 - ring * 0.26)

/** The space between two cards, in base units. Constant, as in the reference. */
const GAP = 0.06

/** Which card is in a given place, once the row has shuffled along `offset` times. */
const cardAt = (slot: number, offset: number, count: number) =>
  (((slot - offset) % count) + count) % count

/**
 * A card's resting size, as a multiple of the base unit.
 *
 * Sized by area rather than by height: a card keeps the proportions of the
 * picture in it, and two cards of the same rank cover the same amount of the
 * page whether they are tall or wide. Scaling by height alone would let a
 * broad landscape one place out look bigger than the tall one in the middle,
 * which loses the order the row is built on.
 */
const sizeOf = (aspect: number) => ({ w: Math.sqrt(aspect), h: 1 / Math.sqrt(aspect) })

/**
 * Lays the row out left to right and returns the centre of each place.
 *
 * Cards keep their own proportions rather than being cropped to a common
 * shape, so each one's width depends on the picture in it — which means the
 * row has to be measured in the order it is actually standing in.
 */
const placeRow = (aspects: number[]) => {
  const n = aspects.length
  const widths = aspects.map((aspect, slot) =>
    aspect === 0 ? 0 : sizeOf(aspect).w * scaleFor(Math.round(Math.abs(slot - (n - 1) / 2))),
  )
  const total = widths.reduce((sum, w) => sum + w, 0) + GAP * (n - 1)
  const centres: number[] = []
  let cursor = -total / 2
  for (const w of widths) {
    centres.push(cursor + w / 2)
    cursor += w + GAP
  }
  return centres
}

const aspectOf = (image: Card['image']): number => {
  if (!image || typeof image !== 'object') return 1
  const { width, height } = image as Media
  if (!width || !height) return 1
  return width / height
}

type Props = { cards?: Card[] | null }

/**
 * The hero's row of photographs, shuffling one place to the right every couple
 * of seconds so each picture takes its turn in the middle.
 *
 * Every card sits on the same centre line — the size difference alone carries
 * the depth, with no arc and no tilt. Pictures keep their own proportions, so
 * nothing is cropped to fit.
 *
 * The shuffle is a loop, so on every tick one card has to get from the
 * right-hand end back to the left. It goes instantly: the arriving card is
 * placed with its transition switched off, so it is simply already there on
 * the next frame while the rest glide along behind it. No gap opens at either
 * end.
 */
export const HeroCards = ({ cards }: Props) => {
  const items = (cards ?? []).filter(
    (card) => card?.image && typeof card.image === 'object' && card.image.url,
  )
  const count = items.length

  // Under four cards there is no row worth shuffling, so it stays put.
  const shuffles = count >= 4
  const [offset, setOffset] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!shuffles || paused) return
    // Someone who has asked for less motion gets the row, still, as a picture.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setOffset((o) => o + 1), TICK)
    return () => window.clearInterval(id)
  }, [shuffles, paused])

  if (!count) return null

  // Measure the row as it currently stands, place by place.
  const centres = placeRow(
    Array.from({ length: count }, (_, slot) => aspectOf(items[cardAt(slot, offset, count)]?.image)),
  )

  // Tall enough for the tallest picture to take the middle without the row
  // changing height underneath it. Worked out once, over every card, so the
  // page does not shift as they come round.
  const deckHeight = Math.max(...items.map((card) => sizeOf(aspectOf(card.image)).h))

  // The card that starts in the middle is the one worth fetching first.
  const firstMiddle = Math.floor((count - 1) / 2)

  return (
    <div
      className={styles.stage}
      style={{ '--deck-h': deckHeight } as CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ul className={styles.deck}>
        {items.map((card, i) => {
          const slot = (i + offset) % count
          const ring = Math.round(Math.abs(slot - (count - 1) / 2))
          // The card in the first place has just come round from the last one;
          // it is put there outright rather than travelling back across.
          const wrapped = shuffles && slot === 0

          return (
            <li
              className={styles.slot}
              key={card.id ?? i}
              data-ring={ring}
              data-wrapped={wrapped || undefined}
              style={
                {
                  '--x': centres[slot],
                  '--s': scaleFor(ring),
                  // The card's own resting size; only --x and --s change as
                  // the row moves, so every tick is a transform and nothing
                  // re-lays out.
                  '--w': sizeOf(aspectOf(card.image)).w,
                  '--h': sizeOf(aspectOf(card.image)).h,
                  zIndex: 20 - ring * 2,
                } as CSSProperties
              }
            >
              <figure className={styles.card}>
                <MediaImage
                  className={styles.image}
                  media={card.image}
                  priority={i === firstMiddle}
                  sizes="(min-width: 64rem) 20rem, 40vw"
                />
              </figure>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
