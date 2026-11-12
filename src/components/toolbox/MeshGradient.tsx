'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { parseColor, readableOn } from '@/lib/color'
import {
  DEFAULT_MESH,
  MAX_POINTS,
  MIN_POINTS,
  type MeshPoint,
  type MeshState,
  RATIOS,
  colorAt,
  decodeMesh,
  emptiestSpot,
  encodeMesh,
  meshFromColors,
  randomMesh,
  renderMesh,
} from '@/lib/meshGradient'

import { useColorPicker } from './colorPicker/useColorPicker'
import { Icon } from './icons'
import styles from './MeshGradient.module.css'
import ui from './controls.module.css'
import { STORAGE, USE_COLORS_EVENT, copyText, readStored, writeStored } from './shared'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** The long edge of the live preview. A gradient has no detail to lose, so
 *  it is painted small and scaled up, which keeps dragging smooth on a phone. */
const PREVIEW = 320
const EXPORT_LONG_EDGE = 2400

type HandleProps = {
  points: MeshPoint[]
  selected: number
  picking: number | null
  onSelect: (index: number) => void
  onMove: (index: number, x: number, y: number) => void
  onRemove: (index: number) => void
  onPick: (index: number, anchor: HTMLElement) => void
}

/**
 * The points over the picture, each a ring filled with its own colour. Each
 * is a button: drag it to move it, double-click it (or press Enter) to pick
 * its colour, nudge it with the arrow keys, remove it with Delete.
 */
const Handles = ({ points, selected, picking, onSelect, onMove, onRemove, onPick }: HandleProps) => {
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

  const key = (index: number) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
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
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      onRemove(index)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPick(index, event.currentTarget)
    }
  }

  return (
    <>
      {points.map((point, i) => (
        <button
          key={i}
          type="button"
          className={styles.handle}
          data-selected={i === selected || undefined}
          data-picking={i === picking || undefined}
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, '--point': point.color } as React.CSSProperties}
          aria-label={`Point ${i + 1} of ${points.length}, ${point.color.toUpperCase()}. Drag to move, Enter to change its colour`}
          aria-pressed={i === selected}
          onPointerDown={start(i)}
          onDoubleClick={(e) => onPick(i, e.currentTarget)}
          onFocus={() => onSelect(i)}
          onKeyDown={key(i)}
        />
      ))}
    </>
  )
}

/** One point's colour in the rail: a swatch that opens the picker, the hex
 *  to type over, and a way to remove it. */
const Well = ({
  index,
  point,
  selected,
  picking,
  canRemove,
  onPick,
  onSelect,
  onChange,
  onRemove,
}: {
  index: number
  point: MeshPoint
  selected: boolean
  picking: boolean
  canRemove: boolean
  onPick: (anchor: HTMLElement) => void
  onSelect: () => void
  onChange: (hex: string) => void
  onRemove: () => void
}) => {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <li className={styles.well} data-selected={selected || undefined} onFocus={onSelect}>
      <button
        type="button"
        className={styles.swatch}
        style={{ background: point.color, color: readableOn(point.color) }}
        aria-label={`Pick the colour of point ${index + 1}`}
        aria-haspopup="dialog"
        aria-expanded={picking}
        onClick={(e) => {
          onSelect()
          onPick(e.currentTarget)
        }}
      >
        <span aria-hidden="true">{index + 1}</span>
      </button>
      <input
        className={styles.hex}
        type="text"
        spellCheck={false}
        autoComplete="off"
        aria-label={`Point ${index + 1} hex`}
        value={draft ?? point.color.toUpperCase()}
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
      <button
        type="button"
        className={styles.wellRemove}
        aria-label={`Remove point ${index + 1}`}
        title="Remove"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <Icon name="close" size={13} />
      </button>
    </li>
  )
}

/**
 * A mesh gradient maker: points on a picture, each with its own colour,
 * blended smoothly into one another. Drag a point to move its colour about;
 * pick a new colour for it from the rail, or by double-clicking it.
 */
export const MeshGradient = () => {
  const [state, setState] = useState<MeshState>(DEFAULT_MESH)
  const [selected, setSelected] = useState(0)
  const [picking, setPicking] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const canvas = useRef<HTMLCanvasElement>(null)
  const picker = useColorPicker()

  const ratio = RATIOS.find((r) => r.value === state.ratio) ?? RATIOS[0]
  const aspect = ratio.w / ratio.h
  const count = state.points.length

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

  // The palette tool can hand its colours over: one point each.
  useEffect(() => {
    const onColors = (event: Event) => {
      const colors = (event as CustomEvent<string[]>).detail
      if (!colors?.length) return
      picker.close()
      setState((s) => meshFromColors(s, colors))
      setSelected(0)
      setNote(`Palette applied: ${Math.min(colors.length, MAX_POINTS)} points, one for each colour.`)
    }
    window.addEventListener(USE_COLORS_EVENT, onColors)
    return () => window.removeEventListener(USE_COLORS_EVENT, onColors)
  }, [picker])

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

  const setPoint = useCallback((index: number, patch: Partial<MeshPoint>) => {
    setState((s) => ({ ...s, points: s.points.map((p, i) => (i === index ? { ...p, ...patch } : p)) }))
  }, [])

  /** Opens the picker for one point, beside whatever was used to ask. */
  const pickColor = (index: number, anchor: HTMLElement) => {
    const point = state.points[index]
    if (!point) return
    setSelected(index)
    setPicking(index)
    picker.toggle(anchor, point.color, {
      onChange: (hex) => setPoint(index, { color: hex }),
      onClose: (hex, changed) => {
        setPicking((current) => (current === index ? null : current))
        if (changed) setNote(`Point ${index + 1} set to ${hex.toUpperCase()}.`)
      },
    })
  }

  const addPoint = (at?: { x: number; y: number }) => {
    if (count >= MAX_POINTS) return
    picker.close()
    const spot = at ?? emptiestSpot(state.points)
    // It starts out with the colour already showing there, so adding a point
    // changes almost nothing until it's given a colour or moved.
    const point = { ...spot, color: colorAt(state.points, spot.x, spot.y, aspect) }
    setState((s) => ({ ...s, points: [...s.points, point] }))
    setSelected(count)
    setNote(`Point ${count + 1} added. Give it a colour, or drag it somewhere.`)
  }

  const removePoint = (index: number) => {
    if (!state.points[index] || count <= MIN_POINTS) return
    picker.close()
    setState((s) => ({ ...s, points: s.points.filter((_, i) => i !== index) }))
    setSelected(Math.max(0, Math.min(index, count - 2)))
    setNote(`Point ${index + 1} removed. ${count - 1} left.`)
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
      link.download = `meshit-${w}x${h}.png`
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
            points={state.points}
            selected={selected}
            picking={picking}
            onSelect={setSelected}
            onMove={(i, x, y) => setPoint(i, { x, y })}
            onRemove={removePoint}
            onPick={pickColor}
          />
        </div>
      </div>

      <div className={styles.rail}>
        <div className={styles.group}>
          <div className={styles.groupHead}>
            <h3 className={ui.label} id="mesh-colours-label">
              Colours
            </h3>
            <span className={styles.count}>
              {count} of {MAX_POINTS}
            </span>
          </div>
          <ul className={styles.wells} aria-labelledby="mesh-colours-label">
            {state.points.map((point, i) => (
              <Well
                key={i}
                index={i}
                point={point}
                selected={i === selected}
                picking={i === picking}
                canRemove={count > MIN_POINTS}
                onPick={(anchor) => pickColor(i, anchor)}
                onSelect={() => setSelected(i)}
                onChange={(hex) => setPoint(i, { color: hex })}
                onRemove={() => removePoint(i)}
              />
            ))}
          </ul>
          <p className={ui.hint}>One colour for each point on the picture.</p>
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
              picker.close()
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
            onClick={() => {
              picker.close()
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
        Drag a point to move its colour. Double-click a point to change its colour, or double-click the
        picture to add one. Arrow keys nudge the selected point; Delete removes it.
      </p>
      <p className={`${ui.note} ${styles.noteArea}`} role="status" aria-live="polite">
        {note}
      </p>
    </div>
  )
}
