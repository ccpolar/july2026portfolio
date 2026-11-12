import { Icon } from './icons'
import ui from './controls.module.css'
import styles from './LiquidLight.module.css'

/** Where the tool lives: one self-contained page under /public, kept as it
 *  was handed over apart from fitting it to the site (see the notes inside). */
export const LIQUID_LIGHT_SRC = '/tools/liquid-light/index.html'

/**
 * Liquid Light: a WebGL gradient generator, embedded whole. It's its own
 * page rather than a React component so its tuned shader and controls stay
 * exactly as built; it takes the site's colours and type from this page.
 */
export const LiquidLight = () => (
  <div className={styles.tool}>
    <div className={styles.frame}>
      <iframe
        className={styles.iframe}
        src={LIQUID_LIGHT_SRC}
        title="Liquid Light gradient generator"
        allow="clipboard-write; fullscreen"
        loading="lazy"
      />
    </div>
    <div className={styles.foot}>
      <p className={ui.hint}>
        Click into the picture for the shortcuts: Space for a new pattern, C new colours, R remix, P pause,
        H focus mode, S save a PNG.
      </p>
      <a className={ui.button} href={LIQUID_LIGHT_SRC} target="_blank" rel="noreferrer">
        <Icon name="gradient" />
        Open full screen
      </a>
    </div>
  </div>
)
