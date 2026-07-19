'use client'

import { FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

/** Expand #abc to #aabbcc and lowercase; leave anything else for validation. */
const normalize = (raw: string): string => {
  let s = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    s = s
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return `#${s.toLowerCase()}`
}

const isHex = (v: string | null | undefined): v is string =>
  typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)

type Props = TextFieldClientProps & { fallback?: string }

export const ColorField = (props: Props) => {
  const { path, field, fallback = '#000000' } = props
  const { value, setValue, showError, errorMessage } = useField<string>({ path })

  // The native <input type="color"> only accepts a valid 6-digit hex, so it
  // shows the fallback until the text field holds a real colour.
  const swatch = isHex(value) ? value : fallback

  return (
    <div className="field-type text">
      <FieldLabel
        htmlFor={`field-${path}`}
        label={field?.label}
        required={field?.required ?? false}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="color"
          aria-label={`${typeof field?.label === 'string' ? field.label : 'Colour'} picker`}
          value={swatch}
          onChange={(e) => setValue(e.target.value)}
          style={{
            inlineSize: '3rem',
            blockSize: '2.5rem',
            padding: '2px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '4px',
            background: 'var(--theme-input-bg)',
            cursor: 'pointer',
            flex: 'none',
          }}
        />
        <input
          id={`field-${path}`}
          type="text"
          inputMode="text"
          spellCheck={false}
          autoComplete="off"
          value={value ?? ''}
          placeholder={fallback}
          onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => {
            if (e.target.value.trim()) setValue(normalize(e.target.value))
          }}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            textTransform: 'lowercase',
            maxInlineSize: '12rem',
          }}
        />
      </div>

      {field?.admin?.description ? (
        <div className="field-description">{String(field.admin.description)}</div>
      ) : null}

      {showError ? <div className="field-error">{errorMessage}</div> : null}
    </div>
  )
}

export default ColorField
