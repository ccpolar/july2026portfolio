'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { parseColor } from '@/lib/color'
import {
  DEFAULT_MESH,
  MAX_POINTS,
  type MeshPoint,
  type MeshState,
  RATIOS,
  decodeMesh,
  encodeMesh,
  randomMesh,
  renderMesh,
  sourceAt,
} from '@/lib/meshGradient'

import { Icon } from './icons'
import styles from './MeshGradient.module.css'
import ui from './controls.module.css'
import { STORAGE, USE_COLORS_EVENT, copyText, readStored, writeStored } from './shared'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

const CORNERS = ['Top left', 'Top right', 'Bottom left', 'Bottom right'] as const

/** The long edge of the live preview. A gradient has no detail to lose, so
 *  it is painted small and scaled up, which keeps dragging smooth on a phone. */
const PREVIEW = 320
const MAP = 96
const EXPORT_LONG_EDGE = 2400

type HandleProps = {
  points: { x: number; y: number }[]
  selected: number
  small?: boolean
  label: (index: number) => string
  onSelect: (index: number) => void
  onMove: (index: number, x: number, y: number) => void
  onRemove?: (index: number) => void
}

/** Draggable points over a canvas. Each is a button: it can be focused,
 *  nudged with the arrow keys, and removed with Delete. */
const Handles = ({ points, selected, small, label, onSelect, onMove, onRemove }: HandleProps) => {
  const start = (index: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    const handle = event.currentTarget
    const box = handle.parentElement!.getBoundingClientRect()
    handle.setPointerCapture(event.pointerId)
    onSelect(index)
    const move = (e: PointerEvent) =>
      onMove(index, clamp01((e.clientX - box.left) / box.width), clamp01((e.clientY - box.top) / box.height))
    const stop = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  const key = (index: number) => (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 0.05 : 0.01
    const { x, y } = points[index]
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    if (moves[event.key]) {
      event.preventDefault()
      onMove(index, clamp01(x + moves[event.key][0]), clamp01(y + moves[event.key][1]))
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && onRemove) {
      event.preventDefault()
      onRemove(index)
    }
  }

  return (
    <>
      {points.map((point, i) => (
        <button
          key={i}
          type="button"
          className={styles.handle}
          data-small={small || undefined}
          data-selected={i === selected || undefined}
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          aria-label={label(i)}
          aria-pressed={i === selected}
          onPointerDown={start(i)}
          onFocus={() => onSelect(i)}
          onKeyDown={key(i)}
        />
      ))}
    </>
  )
}

/** One corner's colour: a swatch that opens the picker, and the hex to type. */
const Well = ({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) => {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <div className={styles.well}>
      <label className={styles.swatch} style={{ background: value }}>
        <span className="sr-only">{label} colour</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <input
        className={styles.hex}
        type="text"
        spellCheck={false}
        autoComplete="off"
        aria-label={`${label} hex`}
        value={draft ?? value.toUpperCase()}
        onChange={(e) => {
          setDraft(e.target.value)
          const parsed = parseColor(e.target.value)
          if (parsed) onChange(parsed)
        }}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
    </div>
  )
}

/**
 * A mesh gradient maker. Four corner colours make a plain gradient (the
 * colour map); points drag that gradient around on the result. Each point
 * can be moved in both views: on the result to say where it sits, on the
 * colour map to say which colour it carries.
 */
export const MeshGradient = () => {
  const [state, setState] = useState<MeshState>(DEFAULT_MESH)
  const [selected, setSelected] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const canvas = useRef<HTMLCanvasElement>(null)
  const map = useRef<HTMLCanvasElement>(null)

  const ratio = RATIOS.find((r) => r.value === state.ratio) ?? RATIOS[0]
  const aspect = ratio.w / ratio.h

  // A link's gradient wins; failing that, whatever was here last time.
  useEffect(() => {
    const fromLink = decodeMesh(new URLSearchParams(window.location.search).get('mesh'))
    const stored = fromLink ?? decodeMesh(readStored(STORAGE.mesh))
    if (stored) setState(stored)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) writeStored(STORAGE.mesh, encodeMesh(state))
  }, [state, loaded])

  // The palette tool can hand its colours over.
  useEffect(() => {
    const onColors = (event: Event) => {
      const colors = (event as CustomEvent<string[]>).detail
      if (!colors?.length) return
      setState((s) => ({
        ...s,
        colors: [0, 1, 2, 3].map((i) => colors[i % colors.length]) as MeshState['colors'],
      }))
      setNote('Palette colours applied to the gradient.')
    }
    window.addEventListener(USE_COLORS_EVENT, onColors)
    return () => window.removeEventListener(USE_COLORS_EVENT, onColors)
  }, [])

  // Paint the result, straight away. It used to wait for the next animation
  // frame, and a frame isn't promised: while the site's page-to-page
  // transition is running none arrive, and the picture stayed blank for
  // anyone who came in through the navbar. The preview is small enough
  // (a few milliseconds) to paint whenever the state changes.
  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const w = Math.round(aspect >= 1 ? PREVIEW : PREVIEW * aspect)
    const h = Math.round(aspect >= 1 ? PREVIEW / aspect : PREVIEW)
    if (el.width !== w || el.height !== h) {
      el.width = w
      el.height = h
    }
    const image = ctx.createImageData(w, h)
    renderMesh(image.data, w, h, state)
    ctx.putImageData(image, 0, 0)
  }, [state, aspect])

  // The colour map only changes with the colours.
  const colorKey = state.colors.join()
  useEffect(() => {
    const ctx = map.current?.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(MAP, MAP)
    renderMesh(image.data, MAP, MAP, state, { warp: false })
    ctx.putImageData(image, 0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorKey])

  const setPoint = useCallback((index: number, patch: Partial<MeshPoint>) => {
    setState((s) => ({ ...s, points: s.points.map((p, i) => (i === index ? { ...p, ...patch } : p)) }))
  }, [])

  const addPoint = (at?: { x: number; y: number }) => {
    if (state.points.length >= MAX_POINTS) return
    let spot = at
    if (!spot) {
      // The emptiest place of a handful of tries, so a new point doesn't
      // land on top of one that's already there.
      let best = -1
      for (let i = 0; i < 40; i++) {
        const x = 0.12 + Math.random() * 0.76
        const y = 0.12 + Math.random() * 0.76
        const nearest = Math.min(...state.points.map((p) => Math.hypot(p.dx - x, p.dy - y)), 2)
        if (nearest > best) {
          best = nearest
          spot = { x, y }
        }
      }
    }
    if (!spot) return
    // It starts out carrying the colour already under it, so adding a point
    // changes nothing until it is dragged.
    const [sx, sy] = sourceAt(state.points, spot.x, spot.y, aspect)
    const point = { dx: spot.x, dy: spot.y, sx: clamp01(sx), sy: clamp01(sy) }
    setState((s) => ({ ...s, points: [...s.points, point] }))
    setSelected(state.points.length)
    setNote(`Point ${state.points.length + 1} added. Drag it to bend the gradient.`)
  }

  const removePoint = (index: number) => {
    if (!state.points[index]) return
    setState((s) => ({ ...s, points: s.points.filter((_, i) => i !== index) }))
    setSelected(Math.max(0, Math.min(index, state.points.length - 2)))
    setNote(`Point removed. ${state.points.length - 1} left.`)
  }

  const download = async () => {
    setBusy(true)
    // Let the button show it's working before the render takes the thread.
    await new Promise((resolve) => setTimeout(resolve, 40))
    try {
      const w = Math.round(aspect >= 1 ? EXPORT_LONG_EDGE : EXPORT_LONG_EDGE * aspect)
      const h = Math.round(aspect >= 1 ? EXPORT_LONG_EDGE / aspect : EXPORT_LONG_EDGE)
      const out = document.createElement('canvas')
      out.width = w
      out.height = h
      const ctx = out.getContext('2d')!
      const image = ctx.createImageData(w, h)
      renderMesh(image.data, w, h, state, { dither: true })
      ctx.putImageData(image, 0, 0)
      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('No image')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mesh-gradient-${w}x${h}.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setNote(`Saved a ${w} by ${h} PNG.`)
    } catch {
      setNote('The image could not be saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?mesh=${encodeMesh(state)}#mesh-gradient`
    setNote((await copyText(url)) ? 'Link copied.' : 'Could not copy the link.')
  }

  const count = state.points.length

  return (
    <div className={styles.tool}>
      <div className={styles.frame}>
        <div
          className={styles.stage}
          style={{ '--ratio': String(aspect), aspectRatio: `${ratio.w} / ${ratio.h}` } as React.CSSProperties}
          onDoubleClick={(event) => {
            if (event.target !== canvas.current) return
            const box = event.currentTarget.getBoundingClientRect()
            addPoint({
              x: clamp01((event.clientX - box.left) / box.width),
              y: clamp01((event.clientY - box.top) / box.height),
            })
          }}
        >
          <canvas ref={canvas} className={styles.canvas} role="img" aria-label="The mesh gradient" />
          <Handles
            points={state.points.map((p) => ({ x: p.dx, y: p.dy }))}
            selected={selected}
            label={(i) => `Point ${i + 1} of ${count}, position on the gradient`}
            onSelect={setSelected}
            onMove={(i, x, y) => setPoint(i, { dx: x, dy: y })}
            onRemove={removePoint}
          />
        </div>
      </div>

      <div className={styles.rail}>
        <fieldset className={styles.group}>
          <legend className={ui.label}>Corner colours</legend>
          <div className={styles.wells}>
            {CORNERS.map((corner, i) => (
              <Well
                key={corner}
                label={corner}
                value={state.colors[i]}
                onChange={(hex) =>
                  setState((s) => ({
                    ...s,
                    colors: s.colors.map((c, j) => (j === i ? hex : c)) as MeshState['colors'],
                  }))
                }
              />
            ))}
          </div>
        </fieldset>

        <div className={styles.group}>
          <h3 className={ui.label} id="mesh-map-label">
            Colour map
          </h3>
          <div className={styles.mapRow}>
            <div className={styles.map}>
              <canvas
                ref={map}
                width={MAP}
                height={MAP}
                className={styles.canvas}
                role="img"
                aria-labelledby="mesh-map-label"
              />
              <Handles
                small
                points={state.points.map((p) => ({ x: p.sx, y: p.sy }))}
                selected={selected}
                label={(i) => `Point ${i + 1} of ${count}, the colour it takes`}
                onSelect={setSelected}
                onMove={(i, x, y) => setPoint(i, { sx: x, sy: y })}
              />
            </div>
            <p className={ui.hint}>
              Where each point takes its colour. Move one to change it.
            </p>
          </div>
        </div>

        <div className={styles.group}>
          <span className={ui.label} id="mesh-shape-label">
            Shape
          </span>
          <div className={ui.segments} role="group" aria-labelledby="mesh-shape-label">
            {RATIOS.map((r) => (
              <button
                key={r.value}
                type="button"
                className={ui.segment}
                aria-pressed={state.ratio === r.value}
                onClick={() => setState((s) => ({ ...s, ratio: r.value }))}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${ui.bar} ${styles.barArea}`}>
        <div className={ui.barGroup}>
          <button
            type="button"
            className={ui.button}
            onClick={() => {
              setState((s) => randomMesh(s.ratio))
              setSelected(0)
              setNote('New random gradient.')
            }}
          >
            <Icon name="shuffle" />
            Randomise
          </button>
          <button
            type="button"
            className={ui.button}
            onClick={() => addPoint()}
            disabled={count >= MAX_POINTS}
          >
            <Icon name="plus" />
            Add point
          </button>
          <button
            type="button"
            className={ui.button}
            onClick={() => removePoint(selected)}
            disabled={count === 0}
          >
            <Icon name="minus" />
            Remove point
          </button>
          <button
            type="button"
            className={ui.button}
            onClick={() => {
              setState((s) => ({ ...DEFAULT_MESH, ratio: s.ratio }))
              setSelected(0)
              setNote('Gradient reset.')
            }}
          >
            <Icon name="reset" />
            Reset
          </button>
        </div>
        <div className={ui.barGroup}>
          <button type="button" className={ui.button} onClick={share}>
            <Icon name="link" />
            Copy link
          </button>
          <button
            type="button"
            className={`${ui.button} ${ui.primary}`}
            onClick={download}
            disabled={busy}
          >
            <Icon name="download" />
            {busy ? 'Rendering…' : 'Download PNG'}
          </button>
        </div>
      </div>

      <p className={styles.help}>
        Drag a point to bend the gradient, or double-click the picture to add one. Arrow keys nudge the
        selected point.
      </p>
      <p className={`${ui.note} ${styles.noteArea}`} role="status" aria-live="polite">
        {note}
      </p>
    </div>
  )
}
