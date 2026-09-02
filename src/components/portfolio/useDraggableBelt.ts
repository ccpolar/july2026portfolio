'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Pixels per second the belt drifts on its own — roughly one shot every
 * three and a half seconds, the pace the CSS marquee used to run at. */
const DRIFT = 90
/** How far a pointer may travel before the gesture counts as a drag rather
 * than a click on the shot underneath. */
const DRAG_SLOP = 5
/** Per-frame decay of a flick's leftover speed, at 60fps. */
const FRICTION = 0.94
/** How long the drift stands down after the visitor scrolls the belt
 * themselves, so it never fights a touch flick or a trackpad swipe. */
const YIELD_MS = 1200
/** A pointer moved this recently means a mouse is in play, so focus left
 * sitting on a shot shouldn't be read as keyboard traversal. */
const POINTER_RECENT_MS = 1500

type Options = {
  /** How many real items precede the duplicated run, so the loop distance can
   * be measured from the first clone rather than guessed. */
  itemCount: number
  /** Hold the belt still — while the lightbox is open, or in the grid view. */
  frozen?: boolean
}

/**
 * Turns a horizontally overflowing track into a belt that drifts on its own,
 * can be grabbed and thrown, and loops without a seam.
 *
 * The belt is driven by scrollLeft rather than a CSS transform, because the
 * two have to share one axis: a transform-animated track can't also be
 * dragged without the two fighting over the same property. Scrolling also
 * means a trackpad, a touch swipe and a shift-wheel all work for free, and
 * that with JavaScript off the markup is still a scrollable row of images.
 *
 * Looping works by rendering the items twice and keeping the scroll position
 * inside the first copy: crossing into the second is silently rewound by one
 * copy's width, which is the same picture in the same place.
 */
export const useDraggableBelt = ({ itemCount, frozen = false }: Options) => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const [dragging, setDragging] = useState(false)

  // Authoritative position, kept as a float so a sub-pixel drift per frame
  // accumulates instead of rounding away to a standstill.
  const pos = useRef(0)
  const drag = useRef({ active: false, startX: 0, startPos: 0, moved: 0, vx: 0, lastX: 0, lastT: 0 })
  const flick = useRef(0)
  const yieldUntil = useRef(0)
  const lastPointer = useRef(0)

  /** One copy's width, measured from the first clone so gaps are included. */
  const loopWidth = useCallback(() => {
    const track = trackRef.current
    const first = track?.children[0] as HTMLElement | undefined
    const clone = track?.children[itemCount] as HTMLElement | undefined
    if (!first || !clone) return 0
    return clone.offsetLeft - first.offsetLeft
  }, [itemCount])

  /** Move to `next`, rewound into the first copy so the belt never runs out
   * of track in either direction. */
  const setPos = useCallback(
    (next: number) => {
      const viewport = viewportRef.current
      if (!viewport) return
      const loop = loopWidth()
      let value = next
      // Only wrap when a copy is wider than the window; with very few items
      // there is nothing to loop through and the row just scrolls normally.
      if (loop > viewport.clientWidth) {
        value = ((value % loop) + loop) % loop
      } else {
        value = Math.max(0, Math.min(value, viewport.scrollWidth - viewport.clientWidth))
      }
      pos.current = value
      viewport.scrollLeft = value
    },
    [loopWidth],
  )

  // The drift, the flick's decay, and the pauses — one frame loop for all
  // three so they can never disagree about where the belt is.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000
      last = now
      raf = requestAnimationFrame(frame)

      if (drag.current.active) return

      // A thrown belt coasts to a stop before the drift takes back over.
      if (Math.abs(flick.current) > 1) {
        setPos(pos.current + flick.current * dt)
        flick.current *= Math.pow(FRICTION, dt * 60)
        return
      }
      flick.current = 0

      // Ambient motion is exactly what reduced-motion silences, and what a
      // visitor reaching for a shot wants stopped.
      // Keyboard focus holds the belt still so a shot can be reached without
      // chasing it. Two things must not be mistaken for that: a mouse press,
      // which leaves focus on the button it hit, and closing the lightbox
      // with Escape, which restores focus to the shot that opened it. Either
      // would otherwise stop the belt for good. So: :focus-visible, which a
      // click does not set, and only while no pointer is being moved about.
      const focused = document.activeElement
      const keyboardFocus =
        now - lastPointer.current > POINTER_RECENT_MS &&
        focused instanceof HTMLElement &&
        viewport.contains(focused) &&
        focused.matches(':focus-visible')

      const held =
        frozen ||
        reduced.matches ||
        document.hidden ||
        now < yieldUntil.current ||
        viewport.matches(':hover') ||
        keyboardFocus
      if (held) return

      setPos(pos.current + DRIFT * dt)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [frozen, setPos])

  // A trackpad swipe or shift-wheel scrolls the viewport directly; adopt that
  // position so the drift carries on from where the visitor left it.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const onScroll = () => {
      // Scroll events arrive asynchronously, so a flag set around our own
      // write can't tell the two apart. Position can: our writes leave
      // scrollLeft where we just put it, anyone else's does not.
      if (Math.abs(viewport.scrollLeft - pos.current) < 1.5) return
      // Someone else moved the belt — a touch flick, a trackpad swipe, a
      // shift-wheel. Adopt their position and stay out of the way while the
      // gesture plays out, rather than hauling it back a pixel per frame.
      pos.current = viewport.scrollLeft
      yieldUntil.current = performance.now() + YIELD_MS
    }
    const onPointerMove = () => {
      lastPointer.current = performance.now()
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      viewport.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    // Touch already has native momentum scrolling that feels better than
    // anything reimplemented here; only mouse and pen need the grab.
    if (e.pointerType === 'touch' || e.button !== 0) return
    const viewport = viewportRef.current
    if (!viewport) return
    flick.current = 0
    drag.current = {
      active: true,
      startX: e.clientX,
      startPos: viewport.scrollLeft,
      moved: 0,
      vx: 0,
      lastX: e.clientX,
      lastT: performance.now(),
    }
    setDragging(true)
    // Capture is deliberately NOT taken here. Capturing retargets the click
    // that follows to this element, which would stop a plain click from ever
    // reaching the shot's own button. It is taken in onPointerMove instead,
    // once the gesture has proved itself a drag.
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    const dx = e.clientX - d.startX
    const wasClick = d.moved <= DRAG_SLOP
    d.moved = Math.max(d.moved, Math.abs(dx))

    // Now that it is a drag rather than a click, take the pointer so the belt
    // keeps following even when the cursor leaves the viewport.
    if (wasClick && d.moved > DRAG_SLOP) {
      viewportRef.current?.setPointerCapture(e.pointerId)
    }

    const now = performance.now()
    const dt = now - d.lastT
    if (dt > 0) d.vx = (e.clientX - d.lastX) / dt // px per ms
    d.lastX = e.clientX
    d.lastT = now

    setPos(d.startPos - dx)
  }

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.active) return
    d.active = false
    setDragging(false)
    if (viewportRef.current?.hasPointerCapture?.(e.pointerId)) {
      viewportRef.current.releasePointerCapture(e.pointerId)
    }
    // Let go mid-sweep and the belt keeps going the way it was thrown.
    flick.current = -d.vx * 1000
  }

  /** A drag ends over a shot, so the browser reports a click on it. Swallow
   * that one, or every grab would also open the lightbox. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved > DRAG_SLOP) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return {
    viewportRef,
    trackRef,
    dragging,
    beltProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  }
}
