import { parseColor } from './color'

/**
 * QuickGrid: bento-style grids from a number of tiles.
 *
 * A layout is a list of rectangles that exactly fill a unit square (0–1 on
 * both axes, measured from the top left). Margin, gutters and corners are
 * applied afterwards, in pixels, so the same arrangement works at any size:
 * the square is mapped onto the canvas inside its margin, then an inner edge
 * is pulled in by half the gutter while an outer edge stays put, which leaves
 * exactly one gutter between neighbours.
 *
 * Every arrangement comes from a seed, so Shuffle is "next seed" and a link
 * can carry the exact grid it showed.
 */

export const STYLES = [
  { value: 'simple', label: 'Simple', hint: 'Even tiles, evenly spaced' },
  { value: 'centered', label: 'Centered', hint: 'One large tile in the middle' },
  { value: 'brick', label: 'Brick', hint: 'Rows offset like brickwork' },
  { value: 'random', label: 'Random', hint: 'Tile sizes shuffled' },
] as const

export type GridStyle = (typeof STYLES)[number]['value']

export const SIZES = [
  { value: '16:9', width: 1920, height: 1080 },
  { value: '4:3', width: 1600, height: 1200 },
  { value: '1:1', width: 1080, height: 1080 },
  { value: '4:5', width: 1080, height: 1350 },
  { value: '9:16', width: 1080, height: 1920 },
] as const

export const MIN_TILES = 1
export const MAX_TILES = 24
export const MAX_GUTTER = 160
export const MAX_MARGIN = 240
export const MAX_RADIUS = 240
export const MIN_SIDE = 100
export const MAX_SIDE = 8000

export type GridState = {
  count: number
  style: GridStyle
  seed: number
  radius: number
  gutter: number
  /** Space between the tiles and the edge of the canvas. */
  margin: number
  width: number
  height: number
  color: string
}

export const DEFAULT_GRID: GridState = {
  count: 7,
  style: 'brick',
  seed: 0,
  radius: 32,
  gutter: 24,
  margin: 24,
  width: 1920,
  height: 1080,
  color: '#121713',
}

export type Rect = { x: number; y: number; w: number; h: number }

/** A small, fast, seeded random number generator (mulberry32). */
const seeded = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const shuffled = <T,>(items: T[], rand: () => number) => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Swaps the axes, for laying a landscape arrangement out on its side. */
const transpose = (rects: Rect[]): Rect[] => rects.map((r) => ({ x: r.y, y: r.x, w: r.h, h: r.w }))

/**
 * How many tiles go in each of `rows` rows: as even as it can be, with the
 * longer rows placed by the seed (seed 0 puts them in the middle, which
 * reads as the calmest).
 */
const spread = (n: number, rows: number, rand: () => number, first: boolean) => {
  const base = Math.floor(n / rows)
  const extra = n % rows
  const counts = Array.from({ length: rows }, () => base)
  if (first) {
    const start = Math.floor((rows - extra) / 2)
    for (let i = 0; i < extra; i++) counts[start + i]++
    return counts
  }
  shuffled(
    Array.from({ length: rows }, (_, i) => i),
    rand,
  )
    .slice(0, extra)
    .forEach((i) => counts[i]++)
  return counts
}

/**
 * The number of rows that keeps tiles closest to a comfortable shape
 * (a little wider than square), best first.
 */
const rowOptions = (n: number, aspect: number) => {
  const scored: { rows: number; score: number }[] = []
  for (let rows = 1; rows <= n; rows++) {
    const counts = spread(n, rows, () => 0, true)
    const score =
      counts.reduce((sum, k) => sum + Math.abs(Math.log(((aspect / k) * rows) / 1.3)), 0) / rows
    scored.push({ rows, score })
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.rows)
}

/** Rows of tiles, each row's widths given by `widths(rowIndex, count)`. */
const rowsOf = (counts: number[], widths: (row: number, k: number) => number[]): Rect[] => {
  const rects: Rect[] = []
  const h = 1 / counts.length
  counts.forEach((k, row) => {
    let x = 0
    for (const w of widths(row, k)) {
      rects.push({ x, y: row * h, w, h })
      x += w
    }
  })
  return rects
}

const simple = (n: number, aspect: number, seed: number): Rect[] => {
  // Laid out in rows on a landscape canvas and in columns on a portrait one,
  // so tiles never end up as slivers.
  const portrait = aspect < 1
  const a = portrait ? 1 / aspect : aspect
  const rand = seeded(seed)
  const options = rowOptions(n, a)
  const rows = seed === 0 ? options[0] : options[Math.floor(rand() * Math.min(2, options.length))]
  const counts = spread(n, rows, rand, seed === 0)
  const rects = rowsOf(counts, (_, k) => Array.from({ length: k }, () => 1 / k))
  return portrait ? transpose(rects) : rects
}

const brick = (n: number, aspect: number, seed: number): Rect[] => {
  const rand = seeded(seed)
  const options = rowOptions(n, aspect)
  // At least two rows, or there's nothing to offset.
  const usable = options.filter((r) => r > 1 || n === 1)
  const rows = seed === 0 ? usable[0] : usable[Math.floor(rand() * Math.min(2, usable.length))]
  const counts = spread(n, rows, rand, seed === 0)
  const flip = seed !== 0 && rand() < 0.5 ? -1 : 1
  return rowsOf(counts, (row, k) => {
    if (k === 1) return [1]
    // Alternate rows lean one way, then sit straight, then lean the other,
    // so the seams step across the grid like brickwork.
    const lean = [-1, 0, 1, 0][row % 4] * flip
    const shift = (lean * 1) / (3 * k)
    const seams = Array.from({ length: k - 1 }, (_, i) => (i + 1) / k + shift)
    const edges = [0, ...seams, 1]
    return edges.slice(1).map((e, i) => e - edges[i])
  })
}

const centered = (n: number, aspect: number, seed: number): Rect[] => {
  if (n === 1) return [{ x: 0, y: 0, w: 1, h: 1 }]
  // Laid out for a landscape canvas, turned on its side for a portrait one.
  const portrait = aspect < 1
  const a = portrait ? 1 / aspect : aspect
  const rand = seeded(seed)
  const others = n - 1
  const heroW = seed === 0 ? 0.5 : 0.44 + rand() * 0.14
  const stripH = 0.22

  // The hero sits in the middle with a column of tiles either side, and
  // full-width rows above and below when there are enough tiles; how many
  // go in the columns and how many in the rows is whatever keeps the tiles
  // closest to a comfortable shape.
  type Plan = { left: number; right: number; top: number; bottom: number }
  const shapeOf = (p: Plan) => {
    const sides = (p.left ? 1 : 0) + (p.right ? 1 : 0)
    const sideW = sides ? (1 - heroW) / sides : 0
    const midH = 1 - (p.top ? stripH : 0) - (p.bottom ? stripH : 0)
    const ratios: number[] = []
    for (const k of [p.left, p.right]) if (k) ratios.push((sideW * a) / (midH / k))
    for (const k of [p.top, p.bottom]) if (k) ratios.push((a / k) / stripH)
    return ratios.reduce((worst, r) => Math.max(worst, Math.abs(Math.log(r / 1.3))), 0)
  }
  // Every way of sharing the other tiles out that keeps the hero in the
  // middle: a column on both sides (once there are two to share), columns
  // within one tile of each other, rows above and below within one of each
  // other, and never a row of a single tile, which would be one long sliver.
  let plan: Plan = { left: Math.floor(others / 2), right: others - Math.floor(others / 2), top: 0, bottom: 0 }
  let best = Infinity
  for (let left = 0; left <= others; left++) {
    for (let right = Math.max(0, left - 1); right <= left + 1 && left + right <= others; right++) {
      if (!left && !right) continue
      if (others >= 2 && (!left || !right)) continue
      const rows = others - left - right
      const splits = rows === 0 ? [[0, 0]] : [[Math.floor(rows / 2), rows - Math.floor(rows / 2)]]
      for (const [top, bottom] of splits) {
        if (top === 1 || bottom === 1) continue
        const candidate = { left, right, top, bottom }
        const score = shapeOf(candidate)
        if (score < best - 1e-9) {
          best = score
          plan = candidate
        }
      }
    }
  }
  if (seed !== 0 && rand() < 0.5) [plan.left, plan.right] = [plan.right, plan.left]
  if (seed !== 0 && rand() < 0.5) [plan.top, plan.bottom] = [plan.bottom, plan.top]

  const { left, right, top, bottom } = plan
  const sides = (left ? 1 : 0) + (right ? 1 : 0)
  const sideW = sides ? (1 - heroW) / sides : 0
  const centerW = sides ? heroW : 1
  const midY = top ? stripH : 0
  const midH = 1 - (top ? stripH : 0) - (bottom ? stripH : 0)

  const rects: Rect[] = []
  const row = (y: number, count: number) => {
    for (let i = 0; i < count; i++) rects.push({ x: i / count, y, w: 1 / count, h: stripH })
  }
  const column = (x: number, count: number) => {
    for (let i = 0; i < count; i++) rects.push({ x, y: midY + (i * midH) / count, w: sideW, h: midH / count })
  }
  if (top) row(0, top)
  if (left) column(0, left)
  const cx = left ? sideW : 0
  // The hero goes in the middle of the list, so it's counted among its
  // neighbours rather than first or last.
  rects.push({ x: cx, y: midY, w: centerW, h: midH })
  if (right) column(cx + centerW, right)
  if (bottom) row(1 - stripH, bottom)
  return portrait ? transpose(rects) : rects
}

const random = (n: number, aspect: number, seed: number): Rect[] => {
  const rand = seeded(seed + 1)
  const rects: Rect[] = [{ x: 0, y: 0, w: 1, h: 1 }]
  // Real proportions, measured so the canvas's shorter side is 1, so "the
  // longer side" is the one that looks longer whatever the canvas shape.
  const unit = Math.min(aspect, 1)
  const px = (r: Rect) => ({ w: (r.w * aspect) / unit, h: r.h / unit })
  // The smallest a tile's side may get; relaxed if it ever leaves nothing
  // that can be split, so the grid always reaches the count asked for.
  let minSide = Math.min(0.2, 0.7 / Math.sqrt(n))
  while (rects.length < n) {
    const options = rects.map((r) => {
      const { w, h } = px(r)
      const vertical = w > h * 1.2 ? true : h > w * 1.2 ? false : rand() < 0.5
      const length = vertical ? w : h
      // Larger tiles are likelier to be split, so the grid stays balanced
      // rather than one corner shattering into crumbs.
      return { vertical, length, weight: length / 2 >= minSide ? (w * h) ** 1.4 : 0 }
    })
    const total = options.reduce((sum, o) => sum + o.weight, 0)
    if (!total) {
      minSide *= 0.75
      continue
    }
    let pick = rand() * total
    let index = options.findIndex((o) => (pick -= o.weight) <= 0)
    if (index < 0) index = options.findIndex((o) => o.weight > 0)
    const r = rects[index]
    const { vertical, length } = options[index]
    const lo = Math.min(0.5, Math.max(0.3, minSide / length))
    const t = lo + rand() * (1 - 2 * lo)
    const [first, second]: Rect[] = vertical
      ? [
          { x: r.x, y: r.y, w: r.w * t, h: r.h },
          { x: r.x + r.w * t, y: r.y, w: r.w * (1 - t), h: r.h },
        ]
      : [
          { x: r.x, y: r.y, w: r.w, h: r.h * t },
          { x: r.x, y: r.y + r.h * t, w: r.w, h: r.h * (1 - t) },
        ]
    rects.splice(index, 1, first, second)
  }
  // Reading order: top to bottom, then left to right.
  return rects.sort((p, q) => (Math.abs(p.y - q.y) > 1e-6 ? p.y - q.y : p.x - q.x))
}

/** The arrangement, as rectangles filling the unit square. */
/** The margin actually used: never so wide that it swallows the canvas. */
const marginFor = (state: { margin?: number; width: number; height: number }) =>
  Math.max(0, Math.min(state.margin ?? 0, state.width / 2 - 8, state.height / 2 - 8))

export const layoutGrid = (
  state: Pick<GridState, 'count' | 'style' | 'seed' | 'width' | 'height'> & { margin?: number },
): Rect[] => {
  const n = Math.max(MIN_TILES, Math.min(MAX_TILES, Math.round(state.count)))
  // The shape the tiles fill: the canvas less its margin.
  const m = marginFor(state)
  const aspect = (state.width - 2 * m) / (state.height - 2 * m)
  switch (state.style) {
    case 'simple':
      return simple(n, aspect, state.seed)
    case 'brick':
      return brick(n, aspect, state.seed)
    case 'centered':
      return centered(n, aspect, state.seed)
    case 'random':
      return random(n, aspect, state.seed)
  }
}

export type Tile = { x: number; y: number; width: number; height: number; radius: number }

/** The tiles in pixels at the grid's size, with gutters and corners applied. */
export const tilesFor = (state: GridState, rects = layoutGrid(state)): Tile[] => {
  const g = state.gutter
  const m = marginFor(state)
  const W = state.width - 2 * m
  const H = state.height - 2 * m
  const edge = 1e-6
  return rects.map((r) => {
    const left = m + r.x * W + (r.x > edge ? g / 2 : 0)
    const top = m + r.y * H + (r.y > edge ? g / 2 : 0)
    const right = m + (r.x + r.w) * W - (r.x + r.w < 1 - edge ? g / 2 : 0)
    const bottom = m + (r.y + r.h) * H - (r.y + r.h < 1 - edge ? g / 2 : 0)
    const width = Math.max(0, right - left)
    const height = Math.max(0, bottom - top)
    return { x: left, y: top, width, height, radius: Math.min(state.radius, width / 2, height / 2) }
  })
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * The grid as an SVG file: plain rectangles, no groups or effects, ready to
 * paste into Figma or Illustrator and clip images into.
 */
export const gridSvg = (state: GridState) => {
  const tiles = tilesFor(state)
  const rects = tiles
    .map(
      (t, i) =>
        `  <rect id="tile-${i + 1}" x="${round(t.x)}" y="${round(t.y)}" width="${round(t.width)}" height="${round(t.height)}"${t.radius > 0 ? ` rx="${round(t.radius)}"` : ''} fill="${state.color}"/>`,
    )
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${state.width}" height="${state.height}" viewBox="0 0 ${state.width} ${state.height}">\n${rects}\n</svg>\n`
}

/* — To and from a link —
   "7.brick.0.32.24.24.1920x1080.121713": count, style, seed, corner
   radius, gutter, margin, size, tile colour. */
export const encodeGrid = (s: GridState) =>
  [s.count, s.style, s.seed, s.radius, s.gutter, s.margin, `${s.width}x${s.height}`, s.color.slice(1)].join('.')

export const decodeGrid = (text: string | null): GridState | null => {
  const match = text?.match(
    /^(\d{1,2})\.(simple|centered|brick|random)\.(\d{1,10})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{2,4})x(\d{2,4})\.([0-9a-f]{6})$/i,
  )
  if (!match) return null
  const clamp = (v: string, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number(v)))
  return {
    count: clamp(match[1], MIN_TILES, MAX_TILES),
    style: match[2].toLowerCase() as GridStyle,
    seed: Number(match[3]) >>> 0,
    radius: clamp(match[4], 0, MAX_RADIUS),
    gutter: clamp(match[5], 0, MAX_GUTTER),
    margin: clamp(match[6], 0, MAX_MARGIN),
    width: clamp(match[7], MIN_SIDE, MAX_SIDE),
    height: clamp(match[8], MIN_SIDE, MAX_SIDE),
    color: parseColor(match[9]) ?? DEFAULT_GRID.color,
  }
}
