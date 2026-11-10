/**
 * Colour maths for the toolbox: conversions, contrast, and the formats a
 * value can be shown in. Everything perceptual goes through OKLab/OKLCH, so
 * a gradient between two colours doesn't sag into grey on the way and a
 * generated palette keeps even steps of lightness.
 *
 * Colours travel between components as lowercase six-digit hex.
 */

export type RGB = [r: number, g: number, b: number]
export type Lab = [L: number, a: number, b: number]
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'cmyk'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Reads #abc, abc, #aabbcc, aabbcc, "rgb(1, 2, 3)" or "1, 2, 3". */
export const parseColor = (input: string): string | null => {
  const text = input.trim().toLowerCase()
  const hex = text.replace(/^#/, '')
  if (/^[0-9a-f]{3}$/.test(hex)) return '#' + hex.replace(/./g, (c) => c + c)
  if (/^[0-9a-f]{6}$/.test(hex)) return '#' + hex
  const triple = text.match(/^(?:rgba?\()?\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)?$/)
  if (triple) {
    const [r, g, b] = triple.slice(1).map(Number)
    if (r <= 255 && g <= 255 && b <= 255) return rgbToHex([r, g, b])
  }
  return null
}

export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const rgbToHex = ([r, g, b]: RGB) =>
  '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

const toLinear = (v: number) => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

const linearToLab = (r: number, g: number, b: number): Lab => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab to linear-light sRGB, unclamped: values outside 0–1 are out of gamut. */
export const labToLinear = (L: number, a: number, b: number): RGB => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export const hexToLab = (hex: string): Lab => {
  const [r, g, b] = hexToRgb(hex)
  return linearToLab(toLinear(r), toLinear(g), toLinear(b))
}

export const hexToOklch = (hex: string) => {
  const [L, a, b] = hexToLab(hex)
  return { l: L, c: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 }
}

/**
 * OKLCH to hex. A colour the screen can't show keeps its lightness and hue
 * and gives up chroma until it fits, which is the least visible way to miss.
 */
export const oklchToHex = (l: number, c: number, h: number) => {
  const rad = (h * Math.PI) / 180
  const fits = (chroma: number) => {
    const rgb = labToLinear(l, chroma * Math.cos(rad), chroma * Math.sin(rad))
    return rgb.every((v) => v >= -0.0005 && v <= 1.0005) ? rgb : null
  }
  let rgb = fits(c)
  if (!rgb) {
    let low = 0
    let high = c
    for (let i = 0; i < 18; i++) {
      const mid = (low + high) / 2
      if (fits(mid)) low = mid
      else high = mid
    }
    rgb = fits(low) ?? labToLinear(l, 0, 0)
  }
  return rgbToHex(rgb.map((v) => toGamma(clamp01(v)) * 255) as RGB)
}

const rgbToHsl = ([r, g, b]: RGB) => {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (!d) return [0, 0, Math.round(l * 100)]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return [Math.round((h * 60 + 360) % 360), Math.round(s * 100), Math.round(l * 100)]
}

const rgbToCmyk = ([r, g, b]: RGB) => {
  const k = 1 - Math.max(r, g, b) / 255
  if (k >= 1) return [0, 0, 0, 100]
  return [
    ...[r, g, b].map((v) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100)),
    Math.round(k * 100),
  ]
}

export const formatColor = (hex: string, format: ColorFormat) => {
  const rgb = hexToRgb(hex)
  if (format === 'rgb') return rgb.join(', ')
  if (format === 'hsl') {
    const [h, s, l] = rgbToHsl(rgb)
    return `${h}, ${s}%, ${l}%`
  }
  if (format === 'cmyk') return rgbToCmyk(rgb).join(', ')
  return hex.toUpperCase()
}

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Near-black or white, whichever reads better on the colour. */
export const readableOn = (hex: string) =>
  contrast(hex, '#ffffff') >= contrast(hex, '#111312') ? '#ffffff' : '#111312'
