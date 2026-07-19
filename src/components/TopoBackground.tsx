import styles from './TopoBackground.module.css'

/**
 * The site's quiet survey-plot backdrop: dashed crosshair axes, dotted
 * concentric circles, and hand-wobbled contour rings around a marked centre,
 * like a single spot height on a topographic sheet.
 *
 * Drawn from fixed constants (no randomness) so the server and client always
 * render the same markup. Colour comes from the theme's ink token, so it
 * follows whatever palette is set in the admin. Sections that carry their own
 * background (the approach band, the contact block) paint over it, so it only
 * shows through the page's open surfaces.
 */

const TAU = Math.PI * 2

// Closed Catmull-Rom spline through points placed at fixed radii around the
// centre — the slight unevenness is what makes it read as drawn, not plotted.
const blob = (cx: number, cy: number, radii: number[]): string => {
  const pts = radii.map((r, i) => {
    const a = (i / radii.length) * TAU - Math.PI / 2
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
  })
  const n = pts.length
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return `${d} Z`
}

const CX = 940
const CY = 430

const OUTER = blob(CX, CY, [300, 252, 318, 288, 242, 306, 268, 296])
const INNER = blob(CX, CY, [152, 172, 140, 166, 148, 174, 136, 158])

export const TopoBackground = () => (
  <div className={styles.topo} aria-hidden="true">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <g stroke="currentColor" fill="none" strokeWidth="1">
        <line x1="0" y1={CY} x2="1440" y2={CY} strokeDasharray="2 7" strokeOpacity="0.5" />
        <line x1={CX} y1="0" x2={CX} y2="900" strokeDasharray="2 7" strokeOpacity="0.5" />
        <circle
          cx={CX}
          cy={CY}
          r="105"
          strokeDasharray="1 8"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
        <circle
          cx={CX}
          cy={CY}
          r="205"
          strokeDasharray="1 8"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        <circle
          cx={CX}
          cy={CY}
          r="305"
          strokeDasharray="1 8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <path d={OUTER} strokeOpacity="0.85" strokeWidth="1.2" />
        <path d={INNER} strokeOpacity="0.4" />
      </g>
      <circle cx={CX} cy={CY} r="3" fill="currentColor" fillOpacity="0.9" />
    </svg>
  </div>
)
