import type { Theme } from '@/payload-types'

const RADIUS: Record<string, string> = {
  sharp: '0px',
  soft: '4px',
  round: '10px',
}

// Defaults are the exact colours the site ships with, so an untouched theme
// renders identically and each field starts from what's already on screen.
const DEFAULTS = {
  background: '#ffffff',
  text: '#12120c',
  mutedText: '#5e5e55',
  surface: '#f6f6f2',
  border: '#deded9',
  brandColor: '#343519',
  signalColor: '#bfc824',
} as const

type Oklch = { l: number; c: number; h: number }

const expandHex = (raw: string): string => {
  const s = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return s
      .split('')
      .map((ch) => ch + ch)
      .join('')
  }
  return s
}

const parseHex = (raw: string | null | undefined): [number, number, number] | null => {
  if (!raw) return null
  const s = expandHex(raw)
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null
  return [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  ]
}

// sRGB channel -> linear light
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

const hexToOklch = (hex: string): Oklch | null => {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [lr, lg, lb] = rgb.map(toLinear)

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const c = Math.sqrt(a * a + b * b)
  let h = (Math.atan2(b, a) * 180) / Math.PI
  if (h < 0) h += 360

  return { l: L, c, h }
}

const relLuminance = (hex: string): number => {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (hexA: string, hexB: string): number => {
  const a = relLuminance(hexA)
  const b = relLuminance(hexB)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const round = (n: number, dp = 4) => Number(n.toFixed(dp))

// Resolve a field to a valid hex, falling back to the shipped default.
const hex = (value: unknown, fallback: string): string =>
  typeof value === 'string' && parseHex(value) ? value.trim() : fallback

/**
 * Turns the editable `theme` global into CSS custom properties.
 *
 * Every colour role — background, text, muted text, surface, border, brand and
 * signal — is an editable hex. Brand and signal are additionally decomposed to
 * OKLCH so the design system can still derive their hover shades and washes.
 * `--on-brand` (text sitting on the brand fill) is chosen by contrast against
 * the site's own background and text, so on-brand surfaces stay readable
 * whatever hue the brand becomes.
 */
export const themeToCss = (theme: Partial<Theme> | null | undefined): string => {
  const t = theme ?? {}

  const background = hex(t.background, DEFAULTS.background)
  const text = hex(t.text, DEFAULTS.text)
  const mutedText = hex(t.mutedText, DEFAULTS.mutedText)
  const surface = hex(t.surface, DEFAULTS.surface)
  const border = hex(t.border, DEFAULTS.border)
  const brandHex = hex(t.brandColor, DEFAULTS.brandColor)
  const signalHex = hex(t.signalColor, DEFAULTS.signalColor)

  const brand = hexToOklch(brandHex) ?? hexToOklch(DEFAULTS.brandColor)!
  const signal = hexToOklch(signalHex) ?? hexToOklch(DEFAULTS.signalColor)!

  // On-brand text: whichever of the site's own background / text reads better
  // on the brand fill. Keeps buttons and the drenched contact section legible
  // for any brand colour, using the palette's own two neutrals.
  const onBrand =
    contrast(background, brandHex) >= contrast(text, brandHex) ? background : text

  return (
    `:root{` +
    `--bg:${background};` +
    `--ink:${text};` +
    `--muted:${mutedText};` +
    `--surface:${surface};` +
    `--line:${border};` +
    `--brand-l:${round(brand.l)};--brand-c:${round(brand.c)};--brand-h:${round(brand.h, 2)};` +
    `--signal-l:${round(signal.l)};--signal-c:${round(signal.c)};--signal-h:${round(signal.h, 2)};` +
    `--on-brand:${onBrand};` +
    `--radius:${RADIUS[t.radius ?? 'sharp'] ?? RADIUS.sharp};` +
    `}`
  )
}
