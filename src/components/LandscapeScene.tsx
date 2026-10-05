import styles from './LandscapeScene.module.css'

/** Which painting each scene draws, and what the shader does to it. */
const ART = {
  clouds: { file: 'cloud-sky', label: 'A painted sky of white clouds over pale blue' },
  landscape: {
    file: 'alpine-lake',
    label: 'A painted alpine scene: a turquoise lake below snow-capped mountains, with pines and a flowering meadow in front',
  },
} as const

export type SceneName = keyof typeof ART

/**
 * One painted backdrop, as a layer that fills whatever it is placed inside.
 *
 * The painting is the scene. It is an ordinary image element, present and
 * visible from the first paint, which is what shows while the texture
 * uploads, on a machine with no WebGL, and whenever someone has asked for
 * less motion. The canvas sits exactly on top of it and only fades in once
 * it has something better to draw — so there is no state in which this is a
 * blank box.
 *
 * Decorative: the paintings carry no information the page doesn't already
 * say in words, so they are hidden from screen readers rather than described
 * at length to someone who only wants the footer's links. The description
 * above is kept for whoever next has to work out which file is which.
 */
export const LandscapeScene = ({
  scene,
  className,
  priority = false,
}: {
  scene: SceneName
  className?: string
  /** The hero's sky is on screen at once; the footer's is a page away. */
  priority?: boolean
}) => {
  const base = `/landscape/${ART[scene].file}`

  return (
    <div
      className={[styles.scene, className].filter(Boolean).join(' ')}
      data-landscape={scene}
      aria-hidden="true"
    >
      {/* A plain img rather than next/image on purpose: the shader uploads
          this very element as a WebGL texture and re-uploads on its load
          event, so it has to be an element whose identity and events are
          ours. The sizes below are already the built, optimised files. */}
      <img
        className={styles.art}
        src={`${base}-1774.webp`}
        srcSet={`${base}-700.webp 700w, ${base}-1100.webp 1100w, ${base}-1774.webp 1774w`}
        sizes="100vw"
        width={1774}
        height={887}
        alt=""
        decoding="async"
        {...(priority ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
      />
      {/* Dims the still painting at night. A real element between the two
          layers, not a pseudo-element over both: the shader dims its own
          output (see landscapeMotion.ts), so each path is darkened exactly
          once and neither depends on how the canvas happens to composite. */}
      <div className={styles.veil} />
      <canvas className={styles.canvas} data-landscape-canvas aria-hidden="true" />
    </div>
  )
}
