'use client'

import { useFormFields } from '@payloadcms/ui'

// Minimal, self-contained WCAG contrast so the panel needs no shared imports.
const parseHex = (raw: unknown): [number, number, number] | null => {
  if (typeof raw !== 'string') return null
  let s = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null
  return [
    parseInt(s.slice(0, 2), 16) / 255,
    parseInt(s.slice(2, 4), 16) / 255,
    parseInt(s.slice(4, 6), 16) / 255,
  ]
}

const luminance = (hex: unknown): number | null => {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const ratio = (a: unknown, b: unknown): number | null => {
  const la = luminance(a)
  const lb = luminance(b)
  if (la === null || lb === null) return null
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const Row = ({
  label,
  fg,
  bg,
  min,
}: {
  label: string
  fg: unknown
  bg: unknown
  min: number
}) => {
  const r = ratio(fg, bg)
  const pass = r !== null && r >= min
  const color = r === null ? '#888' : pass ? '#2e7d32' : '#c0392b'

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.5rem 0',
        borderTop: '1px solid var(--theme-elevation-100)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            inlineSize: '1.5rem',
            blockSize: '1.5rem',
            borderRadius: '4px',
            border: '1px solid var(--theme-elevation-150)',
            background: typeof bg === 'string' ? bg : 'transparent',
            color: typeof fg === 'string' ? fg : 'inherit',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          Aa
        </span>
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontVariantNumeric: 'tabular-nums' }}>
        <strong style={{ color }}>{r === null ? '—' : `${r.toFixed(1)}:1`}</strong>
        <span style={{ color, fontSize: '0.8rem' }}>
          {r === null ? '' : pass ? 'Pass' : 'Low — hard to read'}
        </span>
      </span>
    </li>
  )
}

export const PaletteContrast = () => {
  const background = useFormFields(([fields]) => fields?.background?.value)
  const text = useFormFields(([fields]) => fields?.text?.value)
  const mutedText = useFormFields(([fields]) => fields?.mutedText?.value)

  return (
    <div className="field-type ui" style={{ marginBlockStart: '0.5rem' }}>
      <div className="field-label" style={{ fontWeight: 600 }}>
        Readability
      </div>
      <ul style={{ listStyle: 'none', margin: '0.25rem 0 0', padding: 0 }}>
        <Row label="Text on background" fg={text} bg={background} min={4.5} />
        <Row label="Muted text on background" fg={mutedText} bg={background} min={4.5} />
      </ul>
      <div className="field-description" style={{ marginBlockStart: '0.5rem' }}>
        WCAG AA wants at least 4.5:1 for normal text. Anything lower will be hard to read.
      </div>
    </div>
  )
}

export default PaletteContrast
