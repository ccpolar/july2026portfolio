'use client'

import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { createLandscapeMotion, type LandscapeMotion } from '@/lib/landscapeMotion'

import styles from './LandscapeMotion.module.css'

type Value = {
  paused: boolean
  /** How many painted scenes are actually being drawn by the shader. */
  scenes: number
  toggle: () => void
}

const Context = createContext<Value>({ paused: false, scenes: 0, toggle: () => {} })

/**
 * Runs the painted scenes, for the whole site rather than per scene.
 *
 * One instance drives every `[data-landscape]` on the page — on the homepage
 * that is the hero's sky and the footer's lake, elsewhere just the footer —
 * which is what lets a single control pause both, and what keeps a single
 * animation frame covering both instead of two competing ones.
 *
 * Keyed on the path: the module scans for scenes once when it is created, so
 * moving between pages has to tear the old instance down and build a new one
 * against the new DOM. Without that, navigating from the homepage to /work
 * would leave an instance holding a texture and two observers for a hero
 * that is no longer in the document.
 */
export const LandscapeMotionProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const [motion, setMotion] = useState<LandscapeMotion | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    // An effect, so the DOM this scans is the rendered one. Never on the
    // server: there is no document, no WebGL and nothing to animate.
    const instance = createLandscapeMotion(document, { onPauseChange: setPaused })
    setMotion(instance)
    return () => {
      instance.dispose()
      setMotion(null)
    }
  }, [pathname])

  const toggle = useCallback(() => {
    if (motion) motion.setPaused(!motion.paused)
  }, [motion])

  return (
    <Context.Provider value={{ paused, scenes: motion?.scenes ?? 0, toggle }}>
      {children}
    </Context.Provider>
  )
}

const PlayIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path d="M3 1.5 10.5 6 3 10.5Z" fill="currentColor" />
  </svg>
)

const PauseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path d="M3 1.5h2.2v9H3zM6.8 1.5H9v9H6.8z" fill="currentColor" />
  </svg>
)

/**
 * Stops the clouds and the meadow.
 *
 * A real button whose label says what pressing it will do, so it reads
 * correctly whether it is announced by its text or by its pressed state.
 * It isn't rendered at all when there is nothing moving — no WebGL, or a
 * page with no painted scene on it — because a pause control for a still
 * picture is a lie.
 *
 * Someone whose system asks for reduced motion arrives with this already
 * saying "Play": the scenes are static for them until they ask otherwise.
 */
export const MotionToggle = ({ className }: { className?: string }) => {
  const { paused, scenes, toggle } = useContext(Context)
  if (!scenes) return null

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(' ')}
      onClick={toggle}
      aria-pressed={paused}
    >
      {paused ? <PlayIcon /> : <PauseIcon />}
      {paused ? 'Play motion' : 'Pause motion'}
    </button>
  )
}
