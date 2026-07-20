'use client'

import { FieldLabel, useField } from '@payloadcms/ui'
import type { NumberFieldClientProps } from 'payload'

type Props = NumberFieldClientProps & { unit?: string }

/** A plain <input type="number"> is fine for most numbers, but for a small,
 * bounded range like logo height a slider makes the effect of each value
 * obvious without trial and error. */
export const RangeField = (props: Props) => {
  const { path, field, unit = '' } = props
  const { value, setValue, showError, errorMessage } = useField<number>({ path })

  const min = typeof field?.min === 'number' ? field.min : 0
  const max = typeof field?.max === 'number' ? field.max : 100
  // Payload's form state already seeds `value` from the field's defaultValue
  // on load; this only covers the instant before that state settles.
  const current = typeof value === 'number' ? value : min

  return (
    <div className="field-type number">
      <FieldLabel
        htmlFor={`field-${path}`}
        label={field?.label}
        required={field?.required ?? false}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxInlineSize: '28rem' }}>
        <input
          id={`field-${path}`}
          type="range"
          min={min}
          max={max}
          step={1}
          value={current}
          onChange={(e) => setValue(Number(e.target.value))}
          style={{ flex: '1', cursor: 'pointer' }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.875rem',
            color: 'var(--theme-text)',
            minInlineSize: '3.5rem',
            textAlign: 'right',
            flex: 'none',
          }}
        >
          {current}
          {unit}
        </span>
      </div>

      {field?.admin?.description ? (
        <div className="field-description">{String(field.admin.description)}</div>
      ) : null}

      {showError ? <div className="field-error">{errorMessage}</div> : null}
    </div>
  )
}

export default RangeField
