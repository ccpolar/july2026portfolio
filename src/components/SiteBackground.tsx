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
// Fixed per design direction, not theme-derived like the hover fill below.
const BORDER_COLOR = '#cbcbcb'

export const SiteBackground = () => {
  const [hoverColor, setHoverColor] = useState<string | null>(null)

  useEffect(() => {
    // --signal is the one token the theme explicitly says can be "as vivid
    // as you like", which is exactly right for a rare, momentary hover fill.
    setHoverColor(resolveCssColor('var(--signal)'))
  }, [])

  if (!hoverColor) return null

  return (
    <div className={styles.wrap} aria-hidden="true">
      <ShapeGrid
        direction="diagonal"
        speed={0.1}
        squareSize={25}
        shape="square"
        hoverTrailAmount={0}
        borderColor={BORDER_COLOR}
        hoverFillColor={hoverColor}
      />
    </div>
  )
}
