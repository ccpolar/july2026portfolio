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

/**
 * The dark palette — the moonlit version of the site.
 *
 * The admin's colours describe the light site; rather than ask for a second
 * set of seven, dark mode is a fixed scale. It used to be a neutral one, a
 * near-black page with each surface a small step above it. It is now the
 * night sky the paintings are veiled to: a deep blue page, panels a step up
 * out of it, and type that reads as moonlight rather than as grey. Brand and
 * signal still carry straight over, so the site keeps its accent in both
 * modes.
 *
 * The values come from the approved "Moonlit Clouds & Alpine Lake" design.
 * Only the muted text is ours: the design doesn't specify one, and it has to
 * clear 4.5:1 against the panels as well as the page, which it does at 5.1
 * and 6.9 respectively.
 */
const DARK = {
  background: '#101c30',
  text: '#eef3f8',
  mutedText: '#96a6ba',
  surface: '#22344b',
  border: '#45566c',
  raised: '#22344b',
  gridLine: '#2a3b52',
} as const

/**
 * What the paintings are veiled towards at night, and how far.
 *
 * A touch deeper and bluer than the page itself, so the sky reads as sky
 * rather than as a flat wash of the background colour. The footer's veil is
 * a gradient instead of a single value: heaviest where its sky meets the
 * page's own, lifting towards the meadow so the lake and the flowers keep
 * some of their colour after dark.
 */
const NIGHT_VEIL = {
  color: '#091831',
  /* The design asks for 0.82 here. It is 0.86 because the muted body text
     that runs over this sky — the hero's paragraph — lands at 4.10:1 against
     the brightest cloud at 0.82, and 4.70:1 at 0.86. Four hundredths of a
     veil is not a visible change to the sky; failing the contrast floor on
     body text is. */
  sky: 0.86,
  footerTop: 0.86,
  footerBottom: 0.6,
} as const

/** How light the brand has to be to read as text on the dark page. */
const DARK_BRAND_MIN_L = 0.78

/** The backdrop grid's hairline, too faint at page contrast to derive. */
const LIGHT_GRID_LINE = '#cbcbcb'

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

  // Text sitting on the signal colour (the intake form's Continue button and
  // selected answers): white or the site's own text, whichever reads better.
  const onSignal =
    contrast('#ffffff', signalHex) >= contrast(text, signalHex) ? '#ffffff' : text

  // A raised surface is lighter than the page on either theme, but by very
  // different amounts: a light page lifts most of the way to white, while a
  // dark one only nudges up — lifting a dark page to near-white would put
  // light text on a light chip.
  const raisedLift = relLuminance(background) > 0.18 ? 70 : 8

  // The brand reads as text as well as a fill — the "View project" cues, links
  // in a post — and a deep brand colour disappears on a near-black page. In
  // dark mode it keeps its hue and intensity but is lifted to a lightness that
  // carries on the dark ground, if it isn't already there.
  const darkBrandL = Math.max(brand.l, DARK_BRAND_MIN_L)
  // Lifted that far, the brand is a light fill, so text on it is the dark
  // neutral; a brand already light enough keeps the usual contrast pick.
  const darkOnBrand =
    darkBrandL >= 0.6
      ? DARK.background
      : contrast(DARK.background, brandHex) >= contrast(DARK.text, brandHex)
        ? DARK.background
        : DARK.text
  const darkOnSignal =
    contrast('#ffffff', signalHex) >= contrast(DARK.text, signalHex) ? '#ffffff' : DARK.text

  return (
    `:root{` +
    `--bg:${background};` +
    `--ink:${text};` +
    `--muted:${mutedText};` +
    `--surface:${surface};` +
    `--line:${border};` +
    `--raised:color-mix(in oklch, ${background}, white ${raisedLift}%);` +
    `--brand-l:${round(brand.l)};--brand-c:${round(brand.c)};--brand-h:${round(brand.h, 2)};` +
    `--signal-l:${round(signal.l)};--signal-c:${round(signal.c)};--signal-h:${round(signal.h, 2)};` +
    `--on-brand:${onBrand};` +
    `--on-signal:${onSignal};` +
    `--grid-line:${LIGHT_GRID_LINE};` +
    `--radius:${RADIUS[t.radius ?? 'sharp'] ?? RADIUS.sharp};` +
    `}` +
    // Dark mode. The toggle in the header sets data-theme on <html>; the
    // inline boot script sets it before first paint, so there's no flash.
    `:root[data-theme='dark']{` +
    `--bg:${DARK.background};` +
    `--ink:${DARK.text};` +
    `--muted:${DARK.mutedText};` +
    `--surface:${DARK.surface};` +
    `--line:${DARK.border};` +
    `--raised:${DARK.raised};` +
    `--brand-l:${round(darkBrandL)};` +
    `--on-brand:${darkOnBrand};` +
    `--on-signal:${darkOnSignal};` +
    `--grid-line:${DARK.gridLine};` +
    // Read by the paintings' own veil and by the shader that draws them, so
    // the still image and the animated frame are darkened identically.
    `--scene-veil:${NIGHT_VEIL.color};` +
    `--scene-dim:${NIGHT_VEIL.sky};` +
    `--scene-dim-top:${NIGHT_VEIL.footerTop};` +
    `--scene-dim-bottom:${NIGHT_VEIL.footerBottom};` +
    `color-scheme:dark;` +
    `}`
  )
}
