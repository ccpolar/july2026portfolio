import { hexToLab, oklchToHex, parseColor } from './color'

/**
 * The mesh gradient tool's picture.
 *
 * Two layers make it. Underneath is a plain gradient between four corner
 * colours — the colour map. On top is a set of points, each with two
 * positions: where it sits on the result, and where on the colour map it
 * takes its colour from. Between the points the picture is pulled smoothly
 * from one to the next, so dragging a point bends the gradient around it.
 *
 * Positions run 0–1 from the top-left corner.
 */

export type MeshPoint = { sx: number; sy: number; dx: number; dy: number }

export const RATIOS = [
  { value: 'wide', label: '16:9', w: 16, h: 9 },
  { value: 'square', label: '1:1', w: 1, h: 1 },
  { value: 'tall', label: '9:16', w: 9, h: 16 },
] as const

export type Ratio = (typeof RATIOS)[number]['value']

/** Corner colours in reading order: top left, top right, bottom left, bottom right. */
export type MeshState = { colors: [string, string, string, string]; points: MeshPoint[]; ratio: Ratio }

export const MAX_POINTS = 12

/** What the tool opens on: the site's own greens, with two points pulled
 *  across the middle so it's plain at a glance that the picture bends. */
export const DEFAULT_MESH: MeshState = {
  colors: ['#eef5c8', '#b4de3f', '#2e6b43', '#0f2a1a'],
  ratio: 'wide',
  points: [
    { sx: 0.02, sy: 0.05, dx: 0.05, dy: 0.08 },
    { sx: 0.98, sy: 0.02, dx: 0.95, dy: 0.06 },
    { sx: 0.02, sy: 0.98, dx: 0.06, dy: 0.94 },
    { sx: 0.98, sy: 0.98, dx: 0.94, dy: 0.92 },
    { sx: 0.9, sy: 0.1, dx: 0.3, dy: 0.62 },
    { sx: 0.1, sy: 0.6, dx: 0.7, dy: 0.3 },
  ],
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// Linear light to 8-bit sRGB, looked up rather than computed per pixel.
const GAMMA = new Uint8Array(4096)
for (let i = 0; i < 4096; i++) {
  const c = i / 4095
  GAMMA[i] = Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255)
}

/**
 * Where on the colour map the result's (u, v) takes its colour. Every point
 * pulls with a weight that falls off with distance, so right at a point the
 * answer is that point's own source, and far from all of them it's an
 * average of their pulls.
 */
export const sourceAt = (points: MeshPoint[], u: number, v: number, aspect: number): [number, number] => {
  let wsum = 0
  let ox = 0
  let oy = 0
  for (const p of points) {
    const ex = (u - p.dx) * aspect
    const ey = v - p.dy
    const d2 = ex * ex + ey * ey
    const w = 1 / (d2 * Math.sqrt(d2) + 1e-5)
    wsum += w
    ox += w * (p.sx - p.dx)
    oy += w * (p.sy - p.dy)
  }
  return wsum ? [u + ox / wsum, v + oy / wsum] : [u, v]
}

/**
 * Paints the gradient into RGBA pixels. `warp: false` paints the plain colour
 * map. `dither` breaks up banding with noise too fine to see, worth having
 * in a file someone will stretch across a screen.
 */
export const renderMesh = (
  out: Uint8ClampedArray,
  width: number,
  height: number,
  state: Pick<MeshState, 'colors' | 'points'>,
  { warp = true, dither = false }: { warp?: boolean; dither?: boolean } = {},
) => {
  const [tl, tr, bl, br] = state.colors.map(hexToLab)
  const n = warp ? state.points.length : 0
  const px = new Float32Array(n * 4)
  state.points.slice(0, n).forEach((p, i) => px.set([p.dx, p.dy, p.sx - p.dx, p.sy - p.dy], i * 4))
  // Distances are measured in the picture's own proportions, so a point's
  // reach is round on a wide canvas rather than stretched with it.
  const aspect = width / height

  let o = 0
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width
      let su = u
      let sv = v
      if (n) {
        let wsum = 0
        let ox = 0
        let oy = 0
        for (let i = 0; i < n * 4; i += 4) {
          const ex = (u - px[i]) * aspect
          const ey = v - px[i + 1]
          const d2 = ex * ex + ey * ey
          const w = 1 / (d2 * Math.sqrt(d2) + 1e-5)
          wsum += w
          ox += w * px[i + 2]
          oy += w * px[i + 3]
        }
        su = u + ox / wsum
        sv = v + oy / wsum
      }
      su = su < 0 ? 0 : su > 1 ? 1 : su
      sv = sv < 0 ? 0 : sv > 1 ? 1 : sv

      // The colour map, mixed in OKLab so the midpoints stay clean.
      const a = (1 - su) * (1 - sv)
      const b = su * (1 - sv)
      const c = (1 - su) * sv
      const d = su * sv
      const L = a * tl[0] + b * tr[0] + c * bl[0] + d * br[0]
      const A = a * tl[1] + b * tr[1] + c * bl[1] + d * br[1]
      const B = a * tl[2] + b * tr[2] + c * bl[2] + d * br[2]

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

/** A new arrangement: related colours in the corners, points pulled about. */
export const randomMesh = (ratio: Ratio, rand: () => number = Math.random): MeshState => {
  const hue = rand() * 360
  const spread = 40 + rand() * 120
  const tones: [number, number, number][] = [
    [0.9, 0.06, hue + spread * 0.5],
    [0.72, 0.15, hue + spread],
    [0.5, 0.17, hue],
    [0.26, 0.09, hue - spread * 0.4],
  ]
  // Shuffled, so the light corner isn't always the same one.
  for (let i = tones.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[tones[i], tones[j]] = [tones[j], tones[i]]
  }
  const colors = tones.map(([l, c, h]) => oklchToHex(l, c, (h + 720) % 360)) as MeshState['colors']

  const count = 4 + Math.floor(rand() * 3)
  const points: MeshPoint[] = []
  for (let i = 0; i < count; i++) {
    // The first four hold the corners of the result; the rest land inside,
    // kept apart from each other so two never pinch the picture to a crease.
    let dx = (i % 2 ? 0.94 : 0.06) + (rand() - 0.5) * 0.08
    let dy = (i < 2 ? 0.06 : 0.94) + (rand() - 0.5) * 0.08
    if (i >= 4) {
      for (let tries = 0; tries < 20; tries++) {
        dx = 0.22 + rand() * 0.56
        dy = 0.22 + rand() * 0.56
        if (points.every((p) => Math.hypot(p.dx - dx, p.dy - dy) > 0.24)) break
      }
    }
    points.push({ dx: clamp01(dx), dy: clamp01(dy), sx: rand(), sy: rand() })
  }
  return { colors, points, ratio }
}

/* — To and from a link —
   "f2c79be8eef02f5d3a14304a.square.050780080920…": the four colours, the
   shape, then twelve digits a point (four positions, three digits each). */
const digits = (n: number) => String(Math.round(clamp01(n) * 999)).padStart(3, '0')

export const encodeMesh = (state: MeshState) =>
  [
    state.colors.map((c) => c.slice(1)).join(''),
    state.ratio,
    state.points.map((p) => digits(p.sx) + digits(p.sy) + digits(p.dx) + digits(p.dy)).join(''),
  ].join('.')

export const decodeMesh = (text: string | null): MeshState | null => {
  const match = text?.match(/^([0-9a-f]{24})\.(square|wide|tall)\.((?:\d{12}){0,12})$/i)
  if (!match) return null
  const colors = match[1].match(/.{6}/g)!.map((hex) => parseColor(hex)!) as MeshState['colors']
  const points = (match[3].match(/\d{12}/g) ?? []).map((chunk) => {
    const [sx, sy, dx, dy] = chunk.match(/\d{3}/g)!.map((d) => Number(d) / 999)
    return { sx, sy, dx, dy }
  })
  return { colors, ratio: match[2].toLowerCase() as Ratio, points }
}
