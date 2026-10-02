'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Keep the server-rendered illustration still until it is actually visible. */
export function FooterArt({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let visible = false
    const update = () => {
      element.dataset.wind = visible && !document.hidden ? 'running' : 'paused'
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      update()
    })
    observer.observe(element)
    document.addEventListener('visibilitychange', update)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return <div ref={ref} className={className} data-wind="paused">{children}</div>
}
