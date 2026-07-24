'use client'

import { useEffect, useId, useRef, useState } from 'react'

import styles from './PortfolioTabs.module.css'

type Panel = { id: string; label: string; content: React.ReactNode }

/**
 * A category switcher for the portfolio page. Every panel is rendered into the
 * DOM (so all work is present for search engines and nothing reflows), and the
 * inactive ones are simply hidden. Branding is the default; a matching URL hash
 * (e.g. /portfolio#merchandise) deep-links a category, and selecting one
 * updates the hash so it can be shared.
 */
export const PortfolioTabs = ({
  panels,
  defaultId,
}: {
  panels: Panel[]
  defaultId: string
}) => {
  const [active, setActive] = useState(defaultId)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Init stays defaultId (matches the server render); honour an incoming hash
  // only after mount to avoid a hydration mismatch.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && panels.some((p) => p.id === hash)) setActive(hash)
  }, [panels])

  const select = (id: string) => {
    setActive(id)
    const url = id === defaultId ? window.location.pathname : `#${id}`
    window.history.replaceState(null, '', url)
  }

  // Left/Right arrows move between tabs, per the ARIA tabs pattern.
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next =
      e.key === 'ArrowRight'
        ? (index + 1) % panels.length
        : (index - 1 + panels.length) % panels.length
    select(panels[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <>
      <div className={styles.nav} role="tablist" aria-label="Portfolio categories">
        {panels.map((panel, i) => {
          const selected = active === panel.id
          return (
            <button
              key={panel.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${panel.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${panel.id}`}
              tabIndex={selected ? 0 : -1}
              className={`${styles.tab} ${selected ? styles.tabActive : ''}`}
              onClick={() => select(panel.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {panel.label}
            </button>
          )
        })}
      </div>

      {panels.map((panel) => (
        <div
          key={panel.id}
          role="tabpanel"
          id={`${baseId}-panel-${panel.id}`}
          aria-labelledby={`${baseId}-tab-${panel.id}`}
          hidden={active !== panel.id}
          className={styles.panel}
        >
          {panel.content}
        </div>
      ))}
    </>
  )
}
