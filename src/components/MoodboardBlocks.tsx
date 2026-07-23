'use client'

import { useRef, useState } from 'react'

import type { Moodboard } from '@/payload-types'

import { MediaImage } from './MediaImage'
import styles from './MoodboardBlocks.module.css'

/**
 * The moodboard: a wall of blocks a visitor can pick up and drag around.
 * Drag is a pointer-fine affordance only — on touch devices the same blocks
 * lay out as a plain, tidy grid (see the CSS), because drag-vs-scroll on a
 * phone is a fight nobody wins. Positions live in component state and reset on
 * reload; that's intentional — it's a board to play with, not a layout to save.
 */
export const MoodboardBlocks = ({ items }: { items: Moodboard[] }) => {
  const [offsets, setOffsets] = useState<Record<number, { x: number; y: number }>>({})
  const [dragId, setDragId] = useState<number | null>(null)
  const drag = useRef<{
    id: number
    startX: number
    startY: number
    baseX: number
    baseY: number
  } | null>(null)

  const onPointerDown = (e: React.PointerEvent, id: number) => {
    // Left button / pen / touch only; ignore right-click.
    if (e.button !== 0) return
    const base = offsets[id] ?? { x: 0, y: 0 }
    drag.current = { id, startX: e.clientX, startY: e.clientY, baseX: base.x, baseY: base.y }
    setDragId(id)
    // Capture routes every subsequent move to this block even when the cursor
    // outruns it. It can throw if the pointer's already gone — a dropped
    // capture just means the drag ends early, never a crash.
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* no-op */
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    setOffsets((prev) => ({
      ...prev,
      [d.id]: { x: d.baseX + (e.clientX - d.startX), y: d.baseY + (e.clientY - d.startY) },
    }))
  }

  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* no-op */
    }
    drag.current = null
    setDragId(null)
  }

  if (!items.length) return null

  return (
    <div className={styles.wall}>
      {items.map((item) => {
        const off = offsets[item.id]
        const dragging = dragId === item.id
        return (
          <figure
            key={item.id}
            className={`${styles.block} ${styles[item.blockSize ?? 'medium']} ${
              dragging ? styles.dragging : ''
            }`}
            style={off ? { transform: `translate(${off.x}px, ${off.y}px)` } : undefined}
            data-dragged={off ? 'true' : undefined}
            onPointerDown={(e) => onPointerDown(e, item.id)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <MediaImage
              className={styles.image}
              media={item.image}
              sizes="(min-width: 64rem) 30rem, 45vw"
            />
            <figcaption className={styles.caption}>{item.title}</figcaption>
          </figure>
        )
      })}
    </div>
  )
}
