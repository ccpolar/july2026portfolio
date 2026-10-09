'use client'

import { useEffect, useRef, useState } from 'react'

import {
  applyTheme,
  SKY_HANDOVER_MS,
  SKY_SWAP_AT_MS,
  SKY_TRANSITION_MS,
  THEME_TRANSITION_EVENT,
  type ThemeName,
} from '@/lib/appearance'

import styles from './SkyTransition.module.css'

type Run = { to: ThemeName; id: number }

/**
 * The sun going down, and the moon coming up.
 *
 * Switching palette is a single attribute on <html>, which on its own reads
 * like a light switch. This puts a short piece of sky over the top of it: a
 * warm wash rises, the sun sinks out of frame, and at the point where the
 * wash is heaviest — where you can least see it happen — the palette turns
 * over underneath. Then the moon climbs into the place the real one occupies
 * and the wash clears. Going the other way it runs backwards: the moon sets,
 * the sun comes up.
 *
 * The change does not depend on any of this. `requestTheme` performs the
 * swap itself if nothing here is listening, and anyone who has asked for
 * reduced motion never reaches this component at all — the palette just
 * changes. The animation is something laid over a state change, never the
 * mechanism of it.
 */
export const SkyTransition = () => {
  const [run, setRun] = useState<Run | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const root = document.documentElement
    let id = 0

    const onRequest = (event: Event) => {
      const to = (event as CustomEvent<{ to: ThemeName }>).detail?.to
      if (to !== 'light' && to !== 'dark') return
      // Tell requestTheme the sky has it, so it doesn't also swap.
      event.preventDefault()

      // A second press mid-flight starts again rather than queueing: the
      // visitor has changed their mind, and the honest thing is to show the
      // sky they asked for, not finish the one they interrupted.
      timers.current.forEach(clearTimeout)
      timers.current = []

      const next = { to, id: ++id }
      setRun(next)
      // While this runs, the page's own moon stays out of the sky: the one
      // climbing here is standing in for it, and two moons in a column is
      // not a moonrise. It is let back in before this clears, so the risen
      // one is still on screen to hand over to — a crossfade between the two
      // rather than a swap.
      root.dataset.sky = 'running'
      timers.current.push(
        window.setTimeout(() => applyTheme(to), SKY_SWAP_AT_MS),
        window.setTimeout(() => {
          delete root.dataset.sky
        }, SKY_TRANSITION_MS - SKY_HANDOVER_MS),
        window.setTimeout(() => setRun((r) => (r && r.id === next.id ? null : r)), SKY_TRANSITION_MS),
      )
    }

    root.addEventListener(THEME_TRANSITION_EVENT, onRequest)
    return () => {
      root.removeEventListener(THEME_TRANSITION_EVENT, onRequest)
      timers.current.forEach(clearTimeout)
      timers.current = []
      delete root.dataset.sky
    }
  }, [])

  if (!run) return null

  return (
    // Keyed on the run, so pressing again restarts the animation from the
    // top instead of letting a half-finished one carry on.
    <div
      key={run.id}
      className={styles.sky}
      data-to={run.to}
      aria-hidden="true"
      style={{ '--sky-ms': `${SKY_TRANSITION_MS}ms` } as React.CSSProperties}
    >
      <div className={styles.wash} />
      <div className={styles.sun}>
        <div className={styles.sunDisc} />
      </div>
      <div className={styles.moon}>
        <div className={styles.moonDisc} />
      </div>
    </div>
  )
}
