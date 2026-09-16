'use client'

import { useEffect, useRef, useState, type AnimationEvent, type CSSProperties } from 'react'

import styles from './IntroOverlay.module.css'

export type IntroImage = { small: string; large: string }

type Props = {
  images: IntroImage[]
  logo: { src: string; width?: number; height?: number } | null
  siteName: string
}

/** Each image's time on screen. */
const FRAME_MS = 500
/** If the images aren't decoded by now, skip the intro rather than hold a
 * visitor on a black screen. */
const PRELOAD_CAP_MS = 3000

type Phase = 'idle' | 'loading' | 'running' | 'leaving' | 'skipping' | 'done'

// The page is usable from the moment the overlay starts fading: scroll comes
// back, and the page's own entrance animations (paused until now) play as it
// is revealed.
const releasePage = () => {
  document.documentElement.removeAttribute('data-intro')
  document.querySelector('[data-site-content]')?.removeAttribute('inert')
}

export const IntroOverlay = ({ images, logo, siteName }: Props) => {
  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState(0)
  const framesRef = useRef<HTMLDivElement>(null)
  // Set by Skip. Images can finish decoding after a skip; this stops that late
  // result from starting the sequence the visitor just dismissed.
  const skippedRef = useRef(false)

  useEffect(() => {
    if (document.documentElement.getAttribute('data-intro') !== 'run') return

    let cancelled = false
    setPhase('loading')
    document.querySelector('[data-site-content]')?.setAttribute('inert', '')

    // One variant for the whole sequence, sized to this screen's real pixels.
    const wide = window.innerWidth * (window.devicePixelRatio || 1) > 1400
    const frames = images.map((image, i) => {
      const img = new Image()
      img.decoding = 'async'
      img.alt = ''
      img.src = wide ? image.large : image.small
      img.style.setProperty('--i', String(i))
      return img
    })
    const toDecode = [...frames]
    if (logo) {
      const logoImg = new Image()
      logoImg.src = logo.src
      toDecode.push(logoImg)
    }

    // Decode everything up front so no frame can pop in or flicker mid-sequence.
    const decoded = Promise.all(toDecode.map((img) => img.decode().then(() => true, () => false)))
    const timeout = new Promise<'timeout'>((resolve) => window.setTimeout(() => resolve('timeout'), PRELOAD_CAP_MS))

    void Promise.race([decoded, timeout]).then((result) => {
      if (cancelled || skippedRef.current) return
      const usable = result === 'timeout' ? [] : frames.filter((_, i) => result[i])
      if (!usable.length) {
        releasePage()
        setPhase('skipping')
        return
      }
      usable.forEach((img, i) => {
        img.style.setProperty('--i', String(i))
        framesRef.current?.appendChild(img)
      })
      setCount(usable.length)
      setPhase('running')
    })

    return () => {
      cancelled = true
    }
  }, [images, logo])

  const skip = () => {
    skippedRef.current = true
    releasePage()
    setPhase('skipping')
  }

  const onAnimationStart = (e: AnimationEvent<HTMLDivElement>) => {
    // The sequence's own fade has begun (its delay just elapsed).
    if (e.target === e.currentTarget && phase === 'running') {
      releasePage()
      setPhase('leaving')
    }
  }

  const onAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && (phase === 'leaving' || phase === 'running' || phase === 'skipping')) {
      setPhase('done')
    }
  }

  if (phase === 'done') return null

  const className = [
    styles.overlay,
    phase !== 'idle' ? styles.active : '',
    // Kept through a skip too, so the current frame and the logo stay put while
    // the quick fade runs instead of blinking back to their starting state.
    count > 0 && (phase === 'running' || phase === 'leaving' || phase === 'skipping') ? styles.running : '',
    phase === 'leaving' ? styles.leaving : '',
    phase === 'skipping' ? styles.skipping : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      style={{ '--run': `${Math.max(count, 1) * FRAME_MS}ms` } as CSSProperties}
      onAnimationStart={onAnimationStart}
      onAnimationEnd={onAnimationEnd}
    >
      <div className={styles.frames} ref={framesRef} aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.mark}>
        {logo ? (
          // Loads only when the overlay is actually shown (lazy + display:none
          // otherwise), so visits that skip the intro never download it.
          <img
            className={styles.logo}
            src={logo.src}
            width={logo.width}
            height={logo.height}
            alt={siteName}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.name}>{siteName}</span>
        )}
      </div>
      <button type="button" className={styles.skip} onClick={skip} data-intro-skip>
        Skip
      </button>
    </div>
  )
}
