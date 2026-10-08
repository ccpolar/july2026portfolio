import styles from './Moonlight.module.css'

/**
 * Fixed positions rather than random ones: the stars are rendered on the
 * server as well as the client, and anything random would disagree between
 * the two. Hand-placed to scatter — no grid, nothing in a line, and none of
 * them near enough the moon to compete with it.
 *
 * x and y are percentages of the strip; r is the radius in pixels and o the
 * opacity, both varied so the field has some depth instead of reading as a
 * sheet of identical dots.
 */
const STARS = [
  { x: 6, y: 14, r: 1.1, o: 0.5 },
  { x: 13, y: 38, r: 0.8, o: 0.32 },
  { x: 18, y: 9, r: 1.4, o: 0.62 },
  { x: 24, y: 27, r: 0.9, o: 0.38 },
  { x: 29, y: 52, r: 1.1, o: 0.3 },
  { x: 34, y: 17, r: 0.8, o: 0.45 },
  { x: 41, y: 6, r: 1.2, o: 0.55 },
  { x: 45, y: 33, r: 0.9, o: 0.28 },
  { x: 52, y: 21, r: 1.3, o: 0.5 },
  { x: 57, y: 44, r: 0.8, o: 0.26 },
  { x: 61, y: 11, r: 1, o: 0.42 },
  { x: 66, y: 31, r: 1.2, o: 0.36 },
  { x: 71, y: 7, r: 0.9, o: 0.48 },
  { x: 83, y: 36, r: 1.1, o: 0.4 },
  { x: 88, y: 15, r: 1.3, o: 0.56 },
  { x: 92, y: 48, r: 0.8, o: 0.3 },
  { x: 96, y: 24, r: 1, o: 0.44 },
  { x: 9, y: 58, r: 0.9, o: 0.24 },
  { x: 38, y: 63, r: 1, o: 0.22 },
  { x: 75, y: 57, r: 0.9, o: 0.26 },
] as const

/**
 * The moon, and a scattering of stars, for the night sky.
 *
 * Decoration on top of the painted sky, and only at night. Which theme is in
 * force isn't known on the server — the boot script sets it on <html> before
 * the first paint — so this is always rendered and hidden by CSS in light
 * mode. It costs nothing to carry: a handful of circles and no image.
 *
 * It never takes the pointer and is hidden from screen readers; there is
 * nothing here to read.
 */
export const Moonlight = () => (
  <div className={styles.moonlight} aria-hidden="true">
    <svg className={styles.stars} viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
      {STARS.map((s) => (
        <circle
          key={`${s.x}-${s.y}`}
          cx={s.x}
          cy={s.y}
          /* The strip is stretched by preserveAspectRatio="none", so a plain
             circle would be drawn as an ellipse. Scaling the radius back by
             the strip's own proportions is cheaper than a second viewBox. */
          r={s.r * 0.09}
          fill="#dbeaf7"
          opacity={s.o}
        />
      ))}
    </svg>

    <div className={styles.moon}>
      <svg viewBox="0 0 64 64" focusable="false">
        <defs>
          <radialGradient id="moonlight-disc" cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#eef4fb" />
            <stop offset="100%" stopColor="#c9d9ea" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="27" fill="url(#moonlight-disc)" />
      </svg>
    </div>
  </div>
)
