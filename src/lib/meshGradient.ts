import { hexToLab, oklchToHex, parseColor, rgbToHex } from './color'

/**
 * The mesh gradient tool's picture: a handful of points, each with its own
 * colour, blended smoothly into each other.
 *
 * Every pixel is a weighted mix of all the point colours, the weight falling
 * off with distance (inverse distance, cubed, with a soft core so a point is
 * a round pool of colour rather than a pinprick). The mix happens in OKLab,
 * so the space between two colours never sags into grey.
 *
 * Positions run 0–1 from the top-left corner.
 */

export type MeshPoint = { x: number; y: number; color: string }

export const RATIOS = [
  { value: 'wide', label: '16:9', w: 16, h: 9 },
  { value: 'square', label: '1:1', w: 1, h: 1 },
  { value: 'tall', label: '9:16', w: 9, h: 16 },
] as const

export type Ratio = (typeof RATIOS)[number]['value']

export type MeshState = { points: MeshPoint[]; ratio: Ratio }

export const MIN_POINTS = 2
export const MAX_POINTS = 12

/** How soft each pool of colour is: added to the squared distance before
 *  the falloff, so the blend has no hard centre. */
const SOFTNESS = 0.01

/** What the tool opens on: the site's own greens, one colour a point. */
export const DEFAULT_MESH: MeshState = {
  ratio: 'wide',
  points: [
    { x: 0.08, y: 0.1, color: '#eef5c8' },
    { x: 0.92, y: 0.12, color: '#b4de3f' },
    { x: 0.1, y: 0.9, color: '#2e6b43' },
    { x: 0.9, y: 0.88, color: '#0f2a1a' },
    { x: 0.45, y: 0.5, color: '#c9e265' },
  ],
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// Linear light to 8-bit sRGB, looked up rather than computed per pixel.
const GAMMA = new Uint8Array(4096)
for (let i = 0; i < 4096; i++) {
  const c = i / 4095
  GAMMA[i] = Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255)
}

const labToSrgb = (L: number, A: number, B: number): [number, number, number] => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [r, g, b].map((c) => GAMMA[(clamp01(c) * 4095 + 0.5) | 0]) as [number, number, number]
}

/** The colour the picture shows at (u, v). */
export const colorAt = (points: MeshPoint[], u: number, v: number, aspect: number): string => {
  let ws = 0
  let L = 0
  let A = 0
  let B = 0
  for (const p of points) {
    const [pl, pa, pb] = hexToLab(p.color)
    const dx = (u - p.x) * aspect
    const dy = v - p.y
    const w = 1 / (dx * dx + dy * dy + SOFTNESS) ** 1.5
    ws += w
    L += w * pl
    A += w * pa
    B += w * pb
  }
  return ws ? rgbToHex(labToSrgb(L / ws, A / ws, B / ws)) : '#000000'
}

/**
 * Paints the gradient into RGBA pixels. `dither` breaks up banding with
 * noise too fine to see, worth having in a file someone will stretch across
 * a screen.
 */
export const renderMesh = (
  out: Uint8ClampedArray,
  width: number,
  height: number,
  state: Pick<MeshState, 'points'>,
  { dither = false }: { dither?: boolean } = {},
) => {
  const n = state.points.length
  const px = new Float32Array(n * 5)
  state.points.forEach((p, i) => px.set([p.x, p.y, ...hexToLab(p.color)], i * 5))
  // Distances are measured in the picture's own proportions, so a pool of
  // colour is round on a wide canvas rather than stretched with it.
  const aspect = width / height

  let o = 0
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width
      let ws = 0
      let L = 0
      let A = 0
      let B = 0
      for (let i = 0; i < n * 5; i += 5) {
        const dx = (u - px[i]) * aspect
        const dy = v - px[i + 1]
        const d = dx * dx + dy * dy + SOFTNESS
        const w = 1 / (d * Math.sqrt(d))
        ws += w
        L += w * px[i + 2]
        A += w * px[i + 3]
        B += w * px[i + 4]
      }
      L /= ws
      A /= ws
      B /= ws

      const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
      const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
      const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
      let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
      let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
      let bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
      r = r < 0 ? 0 : r > 1 ? 1 : r
      g = g < 0 ? 0 : g > 1 ? 1 : g
      bb = bb < 0 ? 0 : bb > 1 ? 1 : bb

      let R = GAMMA[(r * 4095 + 0.5) | 0]
      let G = GAMMA[(g * 4095 + 0.5) | 0]
      let Bl = GAMMA[(bb * 4095 + 0.5) | 0]
      if (dither) {
        // One step up or down, on a fixed pattern, so the same picture
        // always exports to the same file.
        const noise = (((x * 12.9898 + y * 78.233) * 43758.5453) % 1) - 0.5
        const step = noise > 0.25 ? 1 : noise < -0.25 ? -1 : 0
        R += step
        G += step
        Bl += step
      }
      out[o++] = R
      out[o++] = G
      out[o++] = Bl
      out[o++] = 255
    }
  }
}

/** The emptiest of a handful of spots, so a new point doesn't land on one
 *  that's already there. */
export const emptiestSpot = (points: MeshPoint[], rand: () => number = Math.random) => {
  let best = { x: 0.5, y: 0.5 }
  let bestGap = -1
  for (let i = 0; i < 40; i++) {
    const x = 0.12 + rand() * 0.76
    const y = 0.12 + rand() * 0.76
    const gap = Math.min(...points.map((p) => Math.hypot(p.x - x, p.y - y)), 2)
    if (gap > bestGap) {
      bestGap = gap
      best = { x, y }
    }
  }
  return best
}

/** A new arrangement: related colours, the corners held, a couple inside. */
export const randomMesh = (ratio: Ratio, rand: () => number = Math.random): MeshState => {
  const hue = rand() * 360
  const spread = 40 + rand() * 120
  const tones: [number, number, number][] = [
    [0.92, 0.05, hue + spread * 0.5],
    [0.74, 0.14, hue + spread],
    [0.55, 0.17, hue],
    [0.28, 0.09, hue - spread * 0.4],
    [0.82, 0.11, hue + spread * 0.75],
    [0.42, 0.13, hue - spread * 0.15],
  ]
  // Shuffled, so the light corner isn't always the same one.
  for (let i = tones.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[tones[i], tones[j]] = [tones[j], tones[i]]
  }
  const count = 4 + Math.floor(rand() * 3)
  const points: MeshPoint[] = []
  for (let i = 0; i < count; i++) {
    const [l, c, h] = tones[i]
    const color = oklchToHex(l, c, (h + 720) % 360)
    if (i < 4) {
      points.push({
        x: clamp01((i % 2 ? 0.9 : 0.1) + (rand() - 0.5) * 0.14),
        y: clamp01((i < 2 ? 0.1 : 0.9) + (rand() - 0.5) * 0.14),
        color,
      })
    } else {
      points.push({ ...emptiestSpot(points, rand), color })
    }
  }
  return { points, ratio }
}

/**
 * Palette colours as a gradient: one point each, keeping the points already
 * there where it can so the picture changes colour rather than shape.
 */
export const meshFromColors = (state: MeshState, colors: string[]): MeshState => {
  const wanted = colors.slice(0, MAX_POINTS)
  const points: MeshPoint[] = []
  wanted.forEach((color, i) => {
    const existing = state.points[i]
    points.push(existing ? { ...existing, color } : { ...emptiestSpot(points.length ? points : state.points), color })
  })
  return { ...state, points }
}

/* — To and from a link —
   "m2.wide.083100eef5c8…": a version mark, the shape, then twelve
   characters a point: three digits across, three down, six of colour. */
const digits = (n: number) => String(Math.round(clamp01(n) * 999)).padStart(3, '0')

export const encodeMesh = (state: MeshState) =>
  ['m2', state.ratio, state.points.map((p) => digits(p.x) + digits(p.y) + p.color.slice(1)).join('')].join('.')

export const decodeMesh = (text: string | null): MeshState | null => {
  if (!text) return null
  const match = text.match(/^m2\.(square|wide|tall)\.((?:\d{6}[0-9a-f]{6}){2,12})$/i)
  if (match) {
    const points = match[2].match(/.{12}/g)!.map((chunk) => ({
      x: Number(chunk.slice(0, 3)) / 999,
      y: Number(chunk.slice(3, 6)) / 999,
      color: parseColor(chunk.slice(6))!,
    }))
    return { ratio: match[1].toLowerCase() as Ratio, points }
  }
  return decodeLegacyMesh(text)
}

/**
 * Links and saved gradients from the first version of the tool, where four
 * corner colours made a gradient and points bent it. Each old point becomes
 * a point carrying the colour it showed, so an old link still opens on much
 * the same picture.
 */
const decodeLegacyMesh = (text: string): MeshState | null => {
  const match = text.match(/^([0-9a-f]{24})\.(square|wide|tall)\.((?:\d{12}){0,12})$/i)
  if (!match) return null
  const ratio = match[2].toLowerCase() as Ratio
  const [tl, tr, bl, br] = match[1].match(/.{6}/g)!.map((hex) => hexToLab('#' + hex.toLowerCase()))
  const old = (match[3].match(/\d{12}/g) ?? []).map((chunk) => {
    const [sx, sy, dx, dy] = chunk.match(/\d{3}/g)!.map((d) => Number(d) / 999)
    return { sx, sy, dx, dy }
  })
  const corner = (u: number, v: number) => {
    const w = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v]
    const mix = [0, 1, 2].map((k) => w[0] * tl[k] + w[1] * tr[k] + w[2] * bl[k] + w[3] * br[k])
    return rgbToHex(labToSrgb(mix[0], mix[1], mix[2]))
  }
  const points: MeshPoint[] = old.length
    ? old.map((p) => ({ x: p.dx, y: p.dy, color: corner(p.sx, p.sy) }))
    : [
        { x: 0.08, y: 0.1, color: corner(0, 0) },
        { x: 0.92, y: 0.1, color: corner(1, 0) },
        { x: 0.08, y: 0.9, color: corner(0, 1) },
        { x: 0.92, y: 0.9, color: corner(1, 1) },
      ]
  while (points.length < MIN_POINTS) points.push({ ...emptiestSpot(points), color: corner(0.5, 0.5) })
  return { ratio, points: points.slice(0, MAX_POINTS) }
}
