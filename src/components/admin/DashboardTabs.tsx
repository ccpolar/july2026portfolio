'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

import styles from './AdminDashboard.module.css'

/**
 * The dashboard's hero tabs: they switch panels in place rather than leaving
 * the page. The tab in use is kept in the address (?tab=work) so a reload,
 * or Back from an edit screen, lands on the same panel.
 */

type Tab = { id: string; label: string }

const TabsContext = createContext<{ active: string; select: (id: string) => void } | null>(null)

const useTabs = () => {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Dashboard tabs used outside DashboardTabsRoot')
  return ctx
}

export const DashboardTabsRoot = ({
  tabs,
  initial,
  children,
}: {
  tabs: Tab[]
  initial: string
  children: ReactNode
}) => {
  const valid = (id: string | null) => (id && tabs.some((t) => t.id === id) ? id : tabs[0].id)
  const [active, setActive] = useState(() => valid(initial))

  const select = useCallback(
    (id: string) => {
      setActive(id)
      const url = new URL(window.location.href)
      if (id === tabs[0].id) url.searchParams.delete('tab')
      else url.searchParams.set('tab', id)
      window.history.replaceState(window.history.state, '', url)
    },
    [tabs],
  )

  // Back/forward through history restores whichever panel the address names.
  // On mount too: coming Back from an edit screen, Next can restore the page
  // it rendered for plain /admin, while the address still says ?tab=work.
  useEffect(() => {
    setActive(valid(new URL(window.location.href).searchParams.get('tab')))
    const onPop = () => setActive(valid(new URL(window.location.href).searchParams.get('tab')))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <TabsContext.Provider value={{ active, select }}>{children}</TabsContext.Provider>
}

export const DashboardTabList = ({ tabs }: { tabs: Tab[] }) => {
  const { active, select } = useTabs()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  // Arrow keys, Home and End move between tabs, as tabs do everywhere else.
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1
    const next =
      e.key === 'ArrowRight'
        ? index === last ? 0 : index + 1
        : e.key === 'ArrowLeft'
          ? index === 0 ? last : index - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null
    if (next === null) return
    e.preventDefault()
    select(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className={styles.tabs} role="tablist" aria-label="Dashboard">
      {tabs.map((tab, i) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`alp-tab-${tab.id}`}
            aria-controls={`alp-panel-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={styles.tab}
            onClick={() => select(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export const DashboardTabPanel = ({ id, children }: { id: string; children: ReactNode }) => {
  const { active } = useTabs()
  return (
    <div
      role="tabpanel"
      id={`alp-panel-${id}`}
      aria-labelledby={`alp-tab-${id}`}
      hidden={active !== id}
      className={styles.panel}
    >
      {children}
    </div>
  )
}
