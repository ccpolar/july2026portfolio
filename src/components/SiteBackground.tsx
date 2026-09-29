'use client'

import { useEffect, useState } from 'react'

import { THEME_CHANGE_EVENT } from '@/lib/appearance'
import { resolveCssColor } from '@/lib/resolveColor'

import { ShapeGrid } from './ShapeGrid'
import styles from './SiteBackground.module.css'

/**
 * The site's backdrop: a slow diagonal drift of squares that light up under
 * the cursor. Colours are read from the theme's own tokens at mount, so the
 * grid always matches whatever palette is set in the admin — the hairline
 * colour for borders, the signal colour (the site's one deliberately bright
 * accent) for the hover fill.
 *
 * Renders nothing until those colours resolve (a single effect, essentially
 * instant) rather than flash a hardcoded colour first.
 */
export const SiteBackground = () => {
  const [colors, setColors] = useState<{ border: string; hover: string } | null>(null)

  // The canvas paints with resolved colours rather than CSS, so it has to be
  // told when the palette changes — the toggle announces it on <html>.
  useEffect(() => {
    const read = () =>
      setColors({
        // The hairline is its own token: at page contrast it's too faint to
        // derive, and it differs between the light and dark palettes.
        border: resolveCssColor('var(--grid-line)'),
        // --signal is the one token the theme explicitly says can be "as vivid
        // as you like", which is exactly right for a rare, momentary hover fill.
        hover: resolveCssColor('var(--signal)'),
      })
    read()
    const root = document.documentElement
    root.addEventListener(THEME_CHANGE_EVENT, read)
    return () => root.removeEventListener(THEME_CHANGE_EVENT, read)
  }, [])

  if (!colors) return null

  return (
    <div className={styles.wrap} aria-hidden="true">
      <ShapeGrid
        direction="diagonal"
        speed={0.1}
        squareSize={25}
        shape="square"
        hoverTrailAmount={0}
        borderColor={colors.border}
        hoverFillColor={colors.hover}
      />
    </div>
  )
}
