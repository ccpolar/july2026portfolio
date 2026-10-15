'use client'

import { type RefObject, useEffect, useRef } from 'react'

/** Seconds the belt takes to pass one shot — the drift's speed. */
const SECONDS_PER_SHOT = 4
/** How long it waits after a drag or a touch before drifting again. */
const RESUME_MS = 1000
/** How far a press has to travel before it counts as a drag, not a click. */
const DRAG_THRESHOLD = 6

/**
 * Drives a looping belt of shots: it drifts left on its own, holds still while
 * hovered or focused, and can be grabbed and dragged either way — by mouse,
 * finger or pen — after which it waits a moment and drifts on from wherever
 * it was left.
 *
 * The belt's track holds two copies of the run end to end. The offset is kept
 * modulo the width of one copy, so whichever way it is pulled, and however
 * far, the second copy is always standing where the first would be and the
 * loop never shows an edge.
 *
 * It's a requestAnimationFrame loop writing one transform, not a CSS
 * animation, because a CSS animation can be paused but not grabbed and moved.
 * The browser stops the loop in a background tab by itself.
 */
export const useDriftBelt = ({
  beltRef,
  trackRef,
  enabled,
  count,
}: {
  beltRef: RefObject<HTMLElement | null>
  trackRef: RefObject<HTMLElement | null>
  enabled: boolean
  count: number
}) => {
  // Whether the next click should be swallowed because it ended a drag.
  const suppressClick = useRef(false)

  useEffect(() => {
    const belt = beltRef.current
    const track = trackRef.current
    if (!enabled || !belt || !track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let offset = 0
    let loop = 0
    let last = 0
    let frame = 0
    let hovering = false
    let focused = false
    let resumeAt = 0
    let drag: { id: number; x: number; from: number; moved: boolean } | null = null

    // One copy's width: from the first shot to its twin at the start of the
    // second copy, which includes the gap between the two runs.
    const measure = () => {
      const kids = track.children
      const first = kids[0] as HTMLElement | undefined
      const twin = kids[count] as HTMLElement | undefined
      loop = first && twin ? twin.offsetLeft - first.offsetLeft : 0
    }

    const wrap = (value: number) => (loop ? ((value % loop) + loop) % loop : 0)
    const paint = () => {
      track.style.transform = `translate3d(${-offset}px, 0, 0)`
    }

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) / 1000 : 0
      last = now
      const still = hovering || focused || drag !== null || now < resumeAt
      if (!still && loop) {
        offset = wrap(offset + (loop / (count * SECONDS_PER_SHOT)) * dt)
        paint()
      }
      frame = requestAnimationFrame(tick)
    }

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hovering = true
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hovering = false
    }

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      drag = { id: e.pointerId, x: e.clientX, from: offset, moved: false }
    }

    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.x
      if (!drag.moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return
        drag.moved = true
        // Only now take the pointer: capturing on press would turn every
        // click on a shot into a click on the belt.
        belt.setPointerCapture(e.pointerId)
        belt.dataset.dragging = ''
      }
      offset = wrap(drag.from - dx)
      paint()
    }

    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      if (drag.moved) suppressClick.current = true
      drag = null
      delete belt.dataset.dragging
      // A finger never "leaves", so a touch always gets the pause; a mouse
      // drag gets it too, so a shot can be lined up and looked at.
      resumeAt = performance.now() + RESUME_MS
    }

    // A drag ends in a click on whatever shot it was released over; that
    // click mustn't open the shot full size.
    const onClick = (e: MouseEvent) => {
      if (!suppressClick.current) return
      suppressClick.current = false
      e.preventDefault()
      e.stopPropagation()
    }

    // Only keyboard focus holds it still. Pressing a shot with the mouse
    // focuses it too, and counting that would leave the belt stopped after
    // every drag until something else on the page was clicked.
    const onFocusIn = (e: FocusEvent) => {
      focused = (e.target as Element).matches?.(':focus-visible') ?? false
    }
    const onFocusOut = (e: FocusEvent) => {
      if (!belt.contains(e.relatedTarget as Node | null)) focused = false
    }

    measure()
    const resize = new ResizeObserver(() => {
      measure()
      offset = wrap(offset)
      paint()
    })
    resize.observe(track)

    belt.addEventListener('pointerenter', onEnter)
    belt.addEventListener('pointerleave', onLeave)
    belt.addEventListener('pointerdown', onDown)
    belt.addEventListener('pointermove', onMove)
    belt.addEventListener('pointerup', onUp)
    belt.addEventListener('pointercancel', onUp)
    belt.addEventListener('click', onClick, true)
    belt.addEventListener('focusin', onFocusIn)
    belt.addEventListener('focusout', onFocusOut)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      belt.removeEventListener('pointerenter', onEnter)
      belt.removeEventListener('pointerleave', onLeave)
      belt.removeEventListener('pointerdown', onDown)
      belt.removeEventListener('pointermove', onMove)
      belt.removeEventListener('pointerup', onUp)
      belt.removeEventListener('pointercancel', onUp)
      belt.removeEventListener('click', onClick, true)
      belt.removeEventListener('focusin', onFocusIn)
      belt.removeEventListener('focusout', onFocusOut)
      delete belt.dataset.dragging
      // Hand the track back clean — the grid lays it out with no offset.
      track.style.transform = ''
    }
  }, [beltRef, trackRef, enabled, count])
}
