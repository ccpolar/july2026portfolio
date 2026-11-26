'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  className?: string
  label: string
  priority?: boolean
}

/**
 * A video upload shown where an image would be: silent, looping and playing
 * on its own, like a GIF, but only while it's on screen, so a page full of
 * clips doesn't play (and download) them all at once.
 *
 * For anyone who has asked their device for less motion it doesn't play by
 * itself; it shows its first frame with controls, to play if they choose.
 */
export const MediaVideo = ({ src, className, label, priority }: Props) => {
  const ref = useRef<HTMLVideoElement>(null)
  const [still, setStill] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) {
      setStill(true)
      video.pause()
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {})
        else video.pause()
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      className={className}
      // '#t=0.001' makes browsers paint the first frame before it plays.
      src={`${src}#t=0.001`}
      muted
      loop
      playsInline
      preload={priority ? 'auto' : 'metadata'}
      controls={still}
      aria-label={label || undefined}
      disablePictureInPicture
    />
  )
}
