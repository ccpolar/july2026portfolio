'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    setColors({
      // Deliberately not --line: that token is scoped to a single 1px
      // divider, and the owner may set it to anything, including something
      // bold — fine for a hairline, overwhelming across ~2,000 grid cells.
      // --ink at low alpha gives a quiet neutral grid that always suits the
      // page it's drawn on, light or dark. --signal is the one token the
      // theme explicitly says can be "as vivid as you like", which is exactly
      // right for a rare, momentary hover fill.
      border: resolveCssColor('color-mix(in srgb, var(--ink) 12%, transparent)'),
      hover: resolveCssColor('var(--signal)'),
    })
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
