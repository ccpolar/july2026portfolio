import type { Client, Homepage, Media } from '@/payload-types'

import styles from './TrustedBy.module.css'

type Props = {
  home: Homepage
  clients: Client[]
}

/** A logo only reads on the page if its background stays transparent. The
 * 480px variant is plenty at this size, but older uploads generated JPEG
 * variants, which would paint a solid box behind the artwork — those, and
 * SVGs (which get no variants), use the original file. */
const logoSrc = (media: Media) => {
  const thumb = media.sizes?.thumb
  return thumb?.url && thumb.mimeType !== 'image/jpeg' ? thumb.url : media.url
}

// Every logo gets roughly the same amount of ink on the page. Fitting them
// all into one box instead lets proportions decide: a long wordmark shrinks to
// a sliver while a short one fills the height. Sizing by area, from each
// file's own aspect ratio, is what makes a mixed wall read as even.
const LOGO_AREA = 2400 // px² of visual weight per logo
const MIN_HEIGHT = 18
const MAX_HEIGHT = 44
const MAX_WIDTH = 150

const logoSize = (media: Media) => {
  const aspect = media.width && media.height ? media.width / media.height : 3
  let height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.sqrt(LOGO_AREA / aspect)))
  let width = height * aspect
  if (width > MAX_WIDTH) {
    width = MAX_WIDTH
    height = width / aspect
  }
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * The businesses Cam has worked with, as a quiet wall of logos directly under
 * the hero. They sit faded and grey so the strip reads as one texture rather
 * than a dozen competing brands; hovering one lifts it onto its own surface in
 * full colour.
 */
export const TrustedBy = ({ home, clients }: Props) => {
  const logos = clients.flatMap((client) => {
    const media = client.logo && typeof client.logo === 'object' ? client.logo : null
    const src = media ? logoSrc(media) : null
    return media && src ? [{ id: client.id, name: client.name, src, ...logoSize(media) }] : []
  })

  if (!logos.length) return null

  const heading = home.trustedHeading?.trim()
  const more = home.trustedMoreLabel?.trim()

  return (
    <section className={`shell ${styles.section}`} aria-label={heading || 'Clients'}>
      {heading ? <h2 className={styles.heading}>{heading}</h2> : null}

      <ul className={styles.logos}>
        {logos.map((logo) => (
          <li className={styles.cell} key={logo.id}>
            <img
              className={styles.logo}
              src={logo.src}
              alt={logo.name}
              width={logo.width}
              height={logo.height}
              loading="lazy"
              decoding="async"
            />
          </li>
        ))}
      </ul>

      {more ? <p className={styles.more}>{more}</p> : null}
    </section>
  )
}
