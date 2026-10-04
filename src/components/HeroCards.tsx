'use client'

import { type CSSProperties, useCallback, useState } from 'react'

import type { Homepage } from '@/payload-types'

import styles from './HeroCards.module.css'
import { MediaImage } from './MediaImage'

type Card = NonNullable<Homepage['heroCards']>[number]

/* — The numbers the fan is shaped by. Everything except the lift is a
     multiple of the card's own size, so the arrangement holds whatever the
     cards are sized to. — */

/** How far apart the cards sit at rest, as a share of a card's width. Just
 *  enough that it reads as a stack of several rather than one photograph. */
const REST_SPREAD = 0.045
/** And how much they lean at rest, at the outermost card. */
const REST_ROT = 3

/** Open, as a share of a card's width: each card covers most of the one
 *  behind it, the way a dealt hand does. Tighter than it looks like it wants
 *  to be, because the fan's open width is what caps how large a card can be:
 *  the two trade directly against each other, and at this size the cards
 *  earn more than the spread does. */
const OPEN_SPREAD = 0.38
/** The outermost card's lean when open. */
const OPEN_ROT = 18
/** How far the outermost card drops, as a share of a card's height. Squared
 *  by distance from the middle, which is what bends the row into an arc
 *  rather than a V. */
const ARC = 0.17

/** The hovered card's rise. */
const LIFT_PX = 18
/** What hovering widens the fan by: a tenth everywhere, and half again as
 *  much from the outermost card as from the middle one. */
const BLOOM_BASE = 0.1
const BLOOM_EDGE = 0.18

/** The proportions each shape cuts a card to. */
const SHAPES: Record<string, number> = {
  square: 1,
  portrait: 3 / 4,
  tall: 2 / 3,
}

/**
 * What a card is cut to when the admin hasn't asked for one of the shapes
 * above: four by five.
 *
 * A fan wants one shape. Cards of several different proportions don't read as
 * a hand of anything — the arc they're meant to describe is broken by every
 * card that is a little shorter or wider than its neighbour. This used to
 * fall back to each photograph's own proportions, which was right for a row
 * that showed them one at a time and wrong for a fan.
 */
const DEFAULT_ASPECT = 4 / 5

/**
 * The shape value is stored as a Postgres enum, so the setting that means
 * "leave them as they were uploaded" still arrives here under its old name
 * even though it now means 4:5 — giving it a truer name would mean altering
 * the enum, for no gain. The admin's label and description say 4:5, which is
 * what it does.
 */
const aspectOf = (_image: Card['image'], shape?: string | null): number =>
  (shape ? SHAPES[shape] : undefined) ?? DEFAULT_ASPECT

/**
 * A card's size as a multiple of the base unit.
 *
 * Sized by area rather than by height, so two cards of different proportions
 * cover the same amount of the page — a landscape one doesn't swamp a tall
 * one just by being wider.
 */
const sizeOf = (aspect: number) => ({ w: Math.sqrt(aspect), h: 1 / Math.sqrt(aspect) })

/**
 * The hero's photographs, held as a hand of cards.
 *
 * At rest they are a tight stack. Bring the pointer anywhere over them and
 * they fan out into a shallow arc; hover one in particular and it lifts to
 * the front while the whole fan opens a little wider — most when the card is
 * an outer one, least when it's the middle.
 *
 * The movement is a CSS transition on a transform, not a timeline. That is
 * the whole reason moving between cards retargets cleanly: a transition
 * always runs from wherever the card currently *is*, so changing the target
 * mid-flight bends the path rather than restarting it. There is nothing to
 * cancel, nothing to cue up, and nothing to clean up on unmount.
 *
 * Every number is worked out from a card's distance from the middle, so the
 * arrangement holds for any number of cards, and all of it is derived from
 * the index — the server and the client arrive at the same values, so there
 * is nothing to reconcile on hydration.
 */
export const HeroCards = ({
  cards,
  shape,
  height,
}: {
  cards?: Card[] | null
  shape?: string | null
  height?: number | null
}) => {
  const items = (cards ?? []).filter(
    (card) => card?.image && typeof card.image === 'object' && card.image.url,
  )
  const count = items.length

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  // pointerleave fires only when the pointer leaves the stage itself, not
  // when it crosses from one card to the next inside it, so crossing between
  // cards retargets rather than closing and reopening the fan.
  const onLeave = useCallback(() => {
    setOpen(false)
    setActive(null)
  }, [])

  if (!count) return null

  const centre = (count - 1) / 2
  // A single card has no spread to speak of; the half keeps the division
  // honest rather than dividing by zero.
  const maxD = Math.max(centre, 0.5)

  const sizes = items.map((card) => sizeOf(aspectOf(card.image, shape)))
  // One card's width and height carry the whole arrangement, so the spacing
  // is even when the photographs are not all the same shape.
  const wRef = Math.max(...sizes.map((s) => s.w))
  const hRef = Math.max(...sizes.map((s) => s.h))

  // How much wider the fan stands while a card is hovered. Worked out once,
  // from which card it is, and handed to the whole fan.
  const bloom =
    active === null ? 1 : 1 + BLOOM_BASE + BLOOM_EDGE * Math.abs((active - centre) / maxD)

  /**
   * How far the fan actually reaches, at its widest.
   *
   * Worked out from the four corners of every card rather than from its
   * width and height: a card is rotated about the middle of its bottom edge,
   * which swings its lower corners out sideways *and down past that edge*,
   * so the room it needs is not the room it occupies standing straight. The
   * first version of this reserved space as though it were, and the outer
   * cards hung some 60px below their own box and over the paragraph under
   * the hero.
   *
   * Everything is in multiples of the base unit, and measured from the point
   * the cards pivot about, so the stage can be sized and the pivot placed
   * from the same two numbers.
   */
  const widest = 1 + BLOOM_BASE + BLOOM_EDGE
  let above = 0
  let below = 0
  let half = 0
  for (let i = 0; i < count; i++) {
    const d = i - centre
    const t = d / maxD
    const rad = (t * OPEN_ROT * widest * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const tx = d * OPEN_SPREAD * wRef * widest
    const ty = t * t * ARC * hRef
    const { w, h } = sizes[i]
    for (const [sx, sy] of [
      [-w / 2, 0],
      [w / 2, 0],
      [-w / 2, -h],
      [w / 2, -h],
    ]) {
      const x = tx + (sx * cos - sy * sin)
      const y = ty + (sx * sin + sy * cos)
      half = Math.max(half, Math.abs(x))
      above = Math.max(above, -y)
      below = Math.max(below, y)
    }
  }
  const stageW = 2 * half

  return (
    // The frame is only here to be measured against: see the note on it in
    // HeroCards.module.css for why the base unit can't be worked out on the
    // stage itself.
    <div className={styles.frame}>
      <div
        className={styles.stage}
        // Pointer, not mouse: one pair of handlers covers a mouse, a trackpad
        // and a stylus. The box is sized for the fan at its widest, so a card
        // opening outward can never cross this boundary and set off the
        // enter/leave pair again.
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={onLeave}
        data-open={open || undefined}
        style={
          {
            '--count': count,
            '--hero-scale': (height ?? 100) / 100,
            '--stage-w': stageW,
            '--above': above,
            '--below': below,
            '--bloom': bloom,
          } as CSSProperties
        }
      >
        <ul className={styles.fan}>
          {items.map((card, i) => {
            const d = i - centre
            const t = d / maxD
            const size = sizes[i]

            return (
              <li
                className={styles.slot}
                key={card.id ?? i}
                data-active={active === i || undefined}
                onPointerEnter={() => setActive(i)}
                style={
                  {
                    '--rest-x': d * REST_SPREAD * wRef,
                    '--rest-y': Math.abs(t) * 0.012 * hRef,
                    '--rest-r': t * REST_ROT,
                    '--open-x': d * OPEN_SPREAD * wRef,
                    '--open-y': t * t * ARC * hRef,
                    '--open-r': t * OPEN_ROT,
                    '--cw': size.w,
                    '--ch': size.h,
                    // The middle card sits in front at rest, and each step
                    // out sits one behind — the stack reads from the middle.
                    '--z': 100 - Math.round(Math.abs(d) * 10),
                  } as CSSProperties
                }
              >
                <figure className={styles.card}>
                  <MediaImage
                    className={styles.image}
                    media={card.image}
                    priority={i === Math.round(centre)}
                    sizes="(min-width: 64rem) 18rem, 40vw"
                  />
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
