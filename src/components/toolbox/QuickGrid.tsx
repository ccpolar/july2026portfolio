'use client'

import { useEffect, useRef, useState } from 'react'

import { parseColor } from '@/lib/color'
import {
  DEFAULT_GRID,
  type GridState,
  type GridStyle,
  MAX_GUTTER,
  MAX_MARGIN,
  MAX_RADIUS,
  MAX_SIDE,
  MAX_TILES,
  MIN_SIDE,
  MIN_TILES,
  SIZES,
  STYLES,
  decodeGrid,
  encodeGrid,
  gridSvg,
  layoutGrid,
  tilesFor,
} from '@/lib/quickGrid'

import { useColorPicker } from './colorPicker/useColorPicker'
import { Icon } from './icons'
import ui from './controls.module.css'
import styles from './QuickGrid.module.css'
import { STORAGE, copyText, readStored, writeStored } from './shared'

/** Small drawings of each style, for its button. */
const STYLE_GLYPHS: Record<GridStyle, string> = {
  simple: 'M2 2h6v5H2zM10 2h6v5h-6zM2 9h4v5H2zM7 9h4v5H7zM12 9h4v5h-4z',
  centered: 'M2 2h3.5v5.5H2zM2 9h3.5v5H2zM6.5 2h5v12h-5zM12.5 2H16v5.5h-3.5zM12.5 9H16v5h-3.5z',
  brick: 'M2 2h5v3.5H2zM8 2h8v3.5H8zM2 6.5h4v3.5H2zM7 6.5h4v3.5H7zM12 6.5h4v3.5h-4zM2 11h9v3H2zM12 11h4v3h-4z',
  random: 'M2 2h8v5H2zM11 2h5v8h-5zM2 8h3.5v6H2zM6.5 8H10v6H6.5zM11 11h5v3h-5z',
}

const StyleGlyph = ({ style }: { style: GridStyle }) => (
  <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true">
    <path d={STYLE_GLYPHS[style]} fill="currentColor" />
  </svg>
)

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** A rounded rectangle traced by hand, for browsers without roundRect. */
const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** A labelled slider with its value beside the label. */
const Slider = ({
  id,
  label,
  value,
  min,
  max,
  unit = '',
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  unit?: string
  onChange: (value: number) => void
}) => (
  <div className={styles.slider}>
    <div className={styles.sliderHead}>
      <label className={ui.label} htmlFor={id}>
        {label}
      </label>
      <output className={styles.value} htmlFor={id}>
        {value}
        {unit}
      </output>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
)

/** A width or height in pixels: typed freely, kept to a sensible range when
 *  you leave the field. */
const SideInput = ({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) => {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    const n = Math.round(Number(draft))
    if (Number.isFinite(n) && n > 0) onCommit(Math.min(MAX_SIDE, Math.max(MIN_SIDE, n)))
    setDraft(null)
  }
  return (
    <input
      className={styles.side}
      type="text"
      inputMode="numeric"
      aria-label={`${label} in pixels`}
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

/**
 * QuickGrid: say how many tiles, pick a style, and it lays out a bento grid
 * that fills the canvas. Shuffle for another arrangement of the same
 * settings; take it away as SVG (plain rectangles, ready to clip images
 * into) or PNG.
 */
export const QuickGrid = () => {
  const [state, setState] = useState<GridState>(DEFAULT_GRID)
  const [loaded, setLoaded] = useState(false)
  const [note, setNote] = useState('')
  const [picking, setPicking] = useState(false)
  const [scale, setScale] = useState(0)
  const [colorDraft, setColorDraft] = useState<string | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const picker = useColorPicker()

  const set = (patch: Partial<GridState>) => setState((s) => ({ ...s, ...patch }))

  // A link's grid wins; failing that, whatever was here last time.
  useEffect(() => {
    const fromLink = decodeGrid(new URLSearchParams(window.location.search).get('grid'))
    const stored = fromLink ?? decodeGrid(readStored(STORAGE.grid))
    if (stored) setState(stored)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) writeStored(STORAGE.grid, encodeGrid(state))
  }, [state, loaded])

  // The preview is drawn at screen size; corners and gutters are set in the
  // export's pixels, so they're scaled down by however much smaller it is.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / state.width)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [state.width])

  const rects = layoutGrid(state)
  const tiles = tilesFor(state, rects)
  // A gutter and margin too big for the count squeeze tiles to nothing.
  const tooSmall = tiles.some((t) => Math.min(t.width, t.height) < 8)
  const preset = SIZES.find((s) => s.width === state.width && s.height === state.height)

  const shuffle = () => {
    // A seed that isn't 0 (0 is the calm, default arrangement).
    set({ seed: 1 + Math.floor(Math.random() * 2 ** 31) })
    setNote('Shuffled.')
  }

  const svgBlob = () => new Blob([gridSvg(state)], { type: 'image/svg+xml' })
  const fileName = (ext: string) => `quickgrid-${state.count}-${state.style}-${state.width}x${state.height}.${ext}`

  const downloadSvg = () => {
    download(svgBlob(), fileName('svg'))
    setNote(`Saved ${fileName('svg')}.`)
  }

  const downloadPng = async () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = state.width
      canvas.height = state.height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = state.color
      for (const t of tiles) {
        roundedRect(ctx, t.x, t.y, t.width, t.height, t.radius)
        ctx.fill()
      }
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('No image')
      download(blob, fileName('png'))
      setNote(`Saved ${fileName('png')}, with a transparent background.`)
    } catch {
      setNote('The image could not be saved. Try again.')
    }
  }

  const copySvg = async () => {
    setNote(
      (await copyText(gridSvg(state)))
        ? 'SVG copied. Paste it straight into Figma or Illustrator.'
        : 'Could not copy the SVG.',
    )
  }

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?grid=${encodeGrid(state)}#quickgrid`
    setNote((await copyText(url)) ? 'Link copied.' : 'Could not copy the link.')
  }

  const pickColor = (anchor: HTMLElement) => {
    setPicking(true)
    picker.toggle(anchor, state.color, {
      onChange: (hex) => set({ color: hex }),
      onClose: (hex, changed) => {
        setPicking(false)
        if (changed) setNote(`Tiles set to ${hex.toUpperCase()}.`)
      },
    })
  }

  return (
    <div className={styles.tool}>
      <div className={styles.frame}>
        {/* An artboard: white, as in a design app, whatever the site theme.
            The files themselves have a transparent background. */}
        <div
          ref={stage}
          className={styles.stage}
          style={
            {
              aspectRatio: `${state.width} / ${state.height}`,
              '--ratio': String(state.width / state.height),
            } as React.CSSProperties
          }
          role="img"
          aria-label={`${state.count} tile ${state.style} grid, ${state.width} by ${state.height} pixels`}
        >
          {scale > 0 &&
            tiles.map((t, i) => (
              <span
                key={i}
                className={styles.tile}
                style={{
                  left: `${(t.x / state.width) * 100}%`,
                  top: `${(t.y / state.height) * 100}%`,
                  width: `${(t.width / state.width) * 100}%`,
                  height: `${(t.height / state.height) * 100}%`,
                  borderRadius: `${t.radius * scale}px`,
                  background: state.color,
                }}
              />
            ))}
        </div>
      </div>

      <div className={styles.rail}>
        <div className={styles.group}>
          <div className={styles.countRow}>
            <label className={ui.label} htmlFor="qg-count">
              Tiles
            </label>
            <div className={styles.stepper}>
              <button
                type="button"
                aria-label="One fewer tile"
                disabled={state.count <= MIN_TILES}
                onClick={() => set({ count: Math.max(MIN_TILES, state.count - 1) })}
              >
                <Icon name="minus" size={14} />
              </button>
              <input
                id="qg-count"
                type="text"
                inputMode="numeric"
                value={state.count}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^\d]/g, ''))
                  if (n >= MIN_TILES) set({ count: Math.min(MAX_TILES, n) })
                }}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                aria-label="One more tile"
                disabled={state.count >= MAX_TILES}
                onClick={() => set({ count: Math.min(MAX_TILES, state.count + 1) })}
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
          </div>
          <input
            type="range"
            aria-label="Number of tiles"
            className={styles.range}
            min={MIN_TILES}
            max={MAX_TILES}
            value={state.count}
            onChange={(e) => set({ count: Number(e.target.value) })}
          />
        </div>

        <fieldset className={styles.group}>
          <legend className={ui.label}>Style</legend>
          <div className={styles.styles}>
            {STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                className={styles.styleButton}
                aria-pressed={state.style === s.value}
                title={s.hint}
                onClick={() => set({ style: s.value })}
              >
                <StyleGlyph style={s.value} />
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className={styles.group}>
          <Slider
            id="qg-radius"
            label="Corner radius"
            value={state.radius}
            min={0}
            max={MAX_RADIUS}
            unit=" px"
            onChange={(radius) => set({ radius })}
          />
          <Slider
            id="qg-gutter"
            label="Gutter"
            value={state.gutter}
            min={0}
            max={MAX_GUTTER}
            unit=" px"
            onChange={(gutter) => set({ gutter })}
          />
          <Slider
            id="qg-margin"
            label="Outer margin"
            value={state.margin}
            min={0}
            max={MAX_MARGIN}
            unit=" px"
            onChange={(margin) => set({ margin })}
          />
          {tooSmall ? (
            <p className={styles.warning} role="status">
              Some tiles are too small to see. Try a smaller gutter or margin, or fewer tiles.
            </p>
          ) : null}
        </div>

        <div className={styles.group}>
          <span className={ui.label} id="qg-size-label">
            Canvas
          </span>
          <div className={`${ui.segments} ${styles.sizes}`} role="group" aria-labelledby="qg-size-label">
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                className={ui.segment}
                aria-pressed={preset?.value === s.value}
                onClick={() => set({ width: s.width, height: s.height })}
              >
                {s.value}
              </button>
            ))}
          </div>
          <div className={styles.dimensions}>
            <SideInput label="Width" value={state.width} onCommit={(width) => set({ width })} />
            <span aria-hidden="true">×</span>
            <SideInput label="Height" value={state.height} onCommit={(height) => set({ height })} />
            <span className={styles.unit}>px</span>
          </div>
        </div>

        <div className={styles.group}>
          <span className={ui.label}>Tile colour</span>
          <div className={styles.well}>
            <button
              type="button"
              className={styles.swatch}
              style={{ background: state.color }}
              aria-label="Pick the tile colour"
              aria-haspopup="dialog"
              aria-expanded={picking}
              onClick={(e) => pickColor(e.currentTarget)}
            />
            <input
              className={styles.hex}
              type="text"
              spellCheck={false}
              autoComplete="off"
              aria-label="Tile colour hex"
              value={colorDraft ?? state.color.toUpperCase()}
              onChange={(e) => {
                setColorDraft(e.target.value)
                const parsed = parseColor(e.target.value)
                if (parsed) set({ color: parsed })
              }}
              onBlur={() => setColorDraft(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
            />
          </div>
        </div>
      </div>

      <div className={`${ui.bar} ${styles.barArea}`}>
        <div className={ui.barGroup}>
          <button type="button" className={ui.button} onClick={shuffle}>
            <Icon name="shuffle" />
            Shuffle
          </button>
          <button
            type="button"
            className={ui.button}
            onClick={() => {
              picker.close()
              setState(DEFAULT_GRID)
              setNote('Grid reset.')
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
          <button type="button" className={ui.button} onClick={copySvg}>
            <Icon name="copy" />
            Copy SVG
          </button>
          <button type="button" className={ui.button} onClick={downloadPng}>
            <Icon name="download" />
            PNG
          </button>
          <button type="button" className={`${ui.button} ${ui.primary}`} onClick={downloadSvg}>
            <Icon name="download" />
            Download SVG
          </button>
        </div>
      </div>

      <p className={styles.help}>
        Shuffle for another arrangement of the same settings. The SVG is plain rectangles, one per tile, ready
        to clip images into; exports have a transparent background.
      </p>
      <p className={`${ui.note} ${styles.noteArea}`} role="status" aria-live="polite">
        {note}
      </p>
    </div>
  )
}
