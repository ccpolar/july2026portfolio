import { hexToOklch, oklchToHex } from './color'

/**
 * The palette tool's generator. It doesn't roll five unrelated colours: it
 * builds a palette the way a brand uses one — a primary, a surface to sit
 * things on, an accent, a quieter support colour and an ink for text — with
 * the hues related by the chosen harmony.
 */

export const HARMONIES = [
  { value: 'any', label: 'Any harmony' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'split', label: 'Split-complementary' },
  { value: 'tetradic', label: 'Tetradic' },
  { value: 'monochromatic', label: 'Monochromatic' },
] as const

export type Harmony = (typeof HARMONIES)[number]['value']

export const ROLES = ['Primary', 'Surface', 'Accent', 'Support', 'Ink', 'Highlight'] as const
export type Role = (typeof ROLES)[number]

export type Swatch = { hex: string; role: Role; locked: boolean }

export const MIN_SWATCHES = 2
export const MAX_SWATCHES = ROLES.length

/** What a first-time visitor sees, and what the server renders: fixed, so the
 *  page is the same on both sides of hydration. */
export const DEFAULT_PALETTE: Swatch[] = [
  { hex: '#1f3b2c', role: 'Primary', locked: false },
  { hex: '#f3f5ef', role: 'Surface', locked: false },
  { hex: '#c9e265', role: 'Accent', locked: false },
  { hex: '#6f8f7b', role: 'Support', locked: false },
  { hex: '#121713', role: 'Ink', locked: false },
]

/** How far round the wheel each role sits from the primary, per harmony. */
const OFFSETS: Record<Exclude<Harmony, 'any'>, Record<'Accent' | 'Support' | 'Highlight', number>> = {
  complementary: { Accent: 180, Support: 12, Highlight: 195 },
  analogous: { Accent: 36, Support: -32, Highlight: 68 },
  triadic: { Accent: 120, Support: 240, Highlight: 132 },
  split: { Accent: 150, Support: 210, Highlight: 24 },
  tetradic: { Accent: 90, Support: 180, Highlight: 270 },
  monochromatic: { Accent: 0, Support: 0, Highlight: 0 },
}

const offsetFor = (harmony: Exclude<Harmony, 'any'>, role: Role) =>
  role === 'Accent' || role === 'Support' || role === 'Highlight' ? OFFSETS[harmony][role] : 0

const between = (rand: () => number, min: number, max: number) => min + rand() * (max - min)

/**
 * A fresh palette for the same roles. Locked swatches are kept, and if one of
 * them has a real hue the rest are built around it, so a brand colour you
 * pinned gets companions rather than strangers.
 */
export const generatePalette = (
  harmonyChoice: Harmony,
  current: Swatch[],
  rand: () => number = Math.random,
): Swatch[] => {
  const options = HARMONIES.filter((h) => h.value !== 'any').map((h) => h.value) as Exclude<Harmony, 'any'>[]
  const harmony = harmonyChoice === 'any' ? options[Math.floor(rand() * options.length)] : harmonyChoice

  let base = rand() * 360
  const anchor = current.find((s) => s.locked && hexToOklch(s.hex).c > 0.03)
  if (anchor) base = hexToOklch(anchor.hex).h - offsetFor(harmony, anchor.role)

  // Two temperaments: a deep, quiet primary, or a brighter one that carries
  // more of the colour itself.
  const bold = rand() < 0.4

  const make = (role: Role): string => {
    const hue = (base + offsetFor(harmony, role) + between(rand, -6, 6) + 720) % 360
    switch (role) {
      case 'Primary':
        return bold
          ? oklchToHex(between(rand, 0.48, 0.6), between(rand, 0.1, 0.17), hue)
          : oklchToHex(between(rand, 0.25, 0.4), between(rand, 0.04, 0.1), hue)
      case 'Surface':
        return oklchToHex(between(rand, 0.955, 0.98), between(rand, 0.004, 0.018), hue)
      case 'Accent':
        return harmony === 'monochromatic'
          ? oklchToHex(between(rand, 0.74, 0.86), between(rand, 0.09, 0.15), hue)
          : oklchToHex(between(rand, 0.7, 0.84), between(rand, 0.12, 0.19), hue)
      case 'Support':
        return oklchToHex(between(rand, 0.52, 0.66), between(rand, 0.03, 0.09), hue)
      case 'Ink':
        return oklchToHex(between(rand, 0.15, 0.21), between(rand, 0.008, 0.025), hue)
      case 'Highlight':
        return oklchToHex(between(rand, 0.86, 0.92), between(rand, 0.05, 0.1), hue)
    }
  }

  return current.map((swatch) => (swatch.locked ? swatch : { ...swatch, hex: make(swatch.role) }))
}

/** The next role a palette doesn't have yet, for "Add a colour". */
export const nextRole = (current: Swatch[]): Role | null =>
  ROLES.find((role) => !current.some((s) => s.role === role)) ?? null

/** A new swatch that belongs with the ones already there. */
export const addSwatch = (current: Swatch[], rand: () => number = Math.random): Swatch[] => {
  const role = nextRole(current)
  if (!role) return current
  // The primary's hue is the anchor; only the new swatch is made.
  const anchor = current.find((s) => s.role === 'Primary') ?? current[0]
  const made = generatePalette(
    'analogous',
    [
      { ...anchor, locked: true },
      { hex: '#000000', role, locked: false },
    ],
    rand,
  )[1]
  return [...current, made]
}

/** Palette to and from a link: "01f3b2c-1f3f5ef": each colour led by the
 *  number of its role, so a palette with one removed keeps its names. */
export const encodePalette = (swatches: Swatch[]) =>
  swatches.map((s) => ROLES.indexOf(s.role) + s.hex.slice(1)).join('-')

export const decodePalette = (text: string | null): Swatch[] | null => {
  if (!text || !/^[0-5][0-9a-f]{6}(-[0-5][0-9a-f]{6}){1,5}$/i.test(text)) return null
  const swatches = text.split('-').map((part) => ({
    hex: '#' + part.slice(1).toLowerCase(),
    role: ROLES[Number(part[0])],
    locked: false,
  }))
  return new Set(swatches.map((s) => s.role)).size === swatches.length ? swatches : null
}
